import { PoolStatus, RideStatus, UserStatus } from "@prisma/client";
import { StatusCodes } from "http-status-codes";

import { prisma } from "../../shared/database/prisma.js";
import { AppError } from "../../shared/errors/app.error.js";
import { validateTransition } from "../pools/pools.state.js";
import { POOL_STATUS_EVENT, RIDE_STATUS_EVENT } from "../events/events.interface.js";
import { EventsService } from "../events/events.service.js";

const findDriver = async (driverId: string) => {
  const driver = await prisma.user.findUnique({ where: { id: driverId } });

  if (!driver) {
    throw new AppError(StatusCodes.NOT_FOUND, "Driver not found");
  }

  return driver;
};

const toggleOnline = async (driverId: string) => {
  const driver = await findDriver(driverId);
  const nextStatus = driver.status === UserStatus.ACTIVE ? UserStatus.OFFLINE : UserStatus.ACTIVE;

  return prisma.user.update({
    where: { id: driverId },
    data: { status: nextStatus },
    select: { id: true, name: true, phone: true, role: true, status: true },
  });
};

const getManifest = async (driverId: string) => {
  const driver = await findDriver(driverId);

  const pools = await prisma.pool.findMany({
    where: { driverId, status: { in: [PoolStatus.FORMING, PoolStatus.ACTIVE] } },
    orderBy: { createdAt: "asc" },
    include: {
      memberships: {
        include: {
          rideRequest: { include: { passenger: true } },
        },
      },
    },
  });

  return {
    driver: { id: driver.id, name: driver.name, phone: driver.phone, status: driver.status },
    pools: pools.map((pool) => ({
      id: pool.id,
      corridorName: pool.corridorName,
      status: pool.status,
      occupiedSeats: pool.occupiedSeats,
      maxCapacity: pool.maxCapacity,
      startedAt: pool.startedAt,
      memberships: pool.memberships.map((membership) => ({
        rideId: membership.rideRequestId,
        passenger: {
          id: membership.rideRequest.passenger.id,
          name: membership.rideRequest.passenger.name,
          phone: membership.rideRequest.passenger.phone,
        },
        pickupZone: membership.rideRequest.pickupZone,
        dropoffZone: membership.rideRequest.dropoffZone,
        allocatedSeats: membership.allocatedSeats,
        individualFarePoysha: membership.individualFarePoysha,
        rideStatus: membership.rideRequest.status,
      })),
    })),
  };
};

const advancePool = async (poolId: string, driverId: string) => {
  const pool = await prisma.pool.findUnique({
    where: { id: poolId },
    include: { memberships: true },
  });

  if (!pool) {
    throw new AppError(StatusCodes.NOT_FOUND, `Pool ${poolId} not found`);
  }

  if (pool.driverId !== driverId) {
    throw new AppError(StatusCodes.FORBIDDEN, "You cannot advance another driver's pool");
  }

  if (pool.status === PoolStatus.COMPLETED || pool.status === PoolStatus.CANCELLED) {
    throw new AppError(StatusCodes.CONFLICT, `Pool is already ${pool.status}`);
  }

  if (pool.memberships.length === 0) {
    throw new AppError(StatusCodes.CONFLICT, "Pool has no rides to advance");
  }

  const result = await prisma.$transaction(async (tx) => {
    const rides = await tx.rideRequest.findMany({
      where: { id: { in: pool.memberships.map((membership) => membership.rideRequestId) } },
    });

    const isForming = pool.status === PoolStatus.FORMING;
    const allArrived = isForming && rides.every((ride) => ride.status === RideStatus.DRIVER_ARRIVED);
    const allStarted = !isForming && rides.every((ride) => ride.status === RideStatus.STARTED);

    let targetRideStatus: RideStatus;
    let nextPoolStatus: PoolStatus;

    if (!isForming) {
      if (allStarted) {
        targetRideStatus = RideStatus.COMPLETED;
        nextPoolStatus = PoolStatus.COMPLETED;
      } else {
        targetRideStatus = RideStatus.STARTED;
        nextPoolStatus = PoolStatus.ACTIVE;
      }
    } else if (allArrived) {
      targetRideStatus = RideStatus.STARTED;
      nextPoolStatus = PoolStatus.ACTIVE;
    } else {
      targetRideStatus = RideStatus.DRIVER_ARRIVED;
      nextPoolStatus = PoolStatus.FORMING;
    }

    for (const ride of rides) {
      validateTransition(ride.status, targetRideStatus);
    }

    const advancedRides = [];
    for (const ride of rides) {
      const updatedRide = await tx.rideRequest.update({
        where: { id: ride.id },
        data: {
          status: targetRideStatus,
          ...(targetRideStatus === RideStatus.COMPLETED
            ? { finalFarePoysha: ride.estimatedFarePoysha }
            : {}),
        },
      });

      await tx.rideEvent.create({
        data: {
          rideRequestId: ride.id,
          fromStatus: ride.status,
          toStatus: targetRideStatus,
          triggeredBy: driverId,
        },
      });

      advancedRides.push(updatedRide);
    }

    const updatedPool = await tx.pool.update({
      where: { id: pool.id },
      data: {
        status: nextPoolStatus,
        ...(nextPoolStatus === PoolStatus.ACTIVE ? { startedAt: new Date() } : {}),
        ...(nextPoolStatus === PoolStatus.COMPLETED ? { completedAt: new Date() } : {}),
      },
    });

    return { pool: updatedPool, rides: advancedRides };
  });

  for (const ride of result.rides) {
    EventsService.broadcast(ride.passengerId, RIDE_STATUS_EVENT, {
      rideId: ride.id,
      status: ride.status,
      finalFarePoysha: ride.finalFarePoysha ?? undefined,
    });
  }
  EventsService.broadcast(driverId, POOL_STATUS_EVENT, {
    poolId,
    status: result.pool.status,
    occupiedSeats: result.pool.occupiedSeats,
  });

  return result;
};

export const DriverService = {
  toggleOnline,
  getManifest,
  advancePool,
};