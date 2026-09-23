import { PoolStatus, RideStatus, UserRole } from "@prisma/client";
import { StatusCodes } from "http-status-codes";

import { prisma } from "../../shared/database/prisma.js";
import { DHAKA_ZONES } from "../../shared/constants/zones.constant.js";
import { AppError } from "../../shared/errors/app.error.js";
import { calculateFare, getFareBreakdown } from "../../shared/utils/fare.calculator.js";
import { getCorridorForRoute } from "../pools/pools.matcher.js";
import { PoolsService } from "../pools/pools.service.js";
import { assertCanCancel, validateTransition } from "../pools/pools.state.js";
import {
  CreateRideRequestInput,
  EstimateInput,
  EstimateResult,
  RideStatusResult,
  RideWithPool,
} from "./rides.interface.js";

type ZoneKey = keyof typeof DHAKA_ZONES;

const assertKnownZones = (pickupZone: string, dropoffZone: string): void => {
  if (!(pickupZone in DHAKA_ZONES) || !(dropoffZone in DHAKA_ZONES)) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      `Unknown zone: "${pickupZone}" or "${dropoffZone}"`,
    );
  }
};

const getDistanceKm = (pickupZone: ZoneKey, dropoffZone: ZoneKey): number =>
  Math.abs(DHAKA_ZONES[dropoffZone].distanceFromBananiKm - DHAKA_ZONES[pickupZone].distanceFromBananiKm);

const findDriverVehicle = async () => {
  const vehicle = await prisma.vehicle.findFirst({
    where: { driver: { role: UserRole.DRIVER } },
    orderBy: { createdAt: "asc" },
  });

  if (!vehicle) {
    throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, "No driver vehicle available for pooling");
  }

  return vehicle;
};

const estimate = async (payload: EstimateInput): Promise<EstimateResult> => {
  assertKnownZones(payload.pickupZone, payload.dropoffZone);

  const pickupZone = payload.pickupZone as ZoneKey;
  const dropoffZone = payload.dropoffZone as ZoneKey;
  const distanceKm = getDistanceKm(pickupZone, dropoffZone);
  const soloFarePoysha = calculateFare(distanceKm, false);
  const pooledFarePoysha = calculateFare(distanceKm, true);
  const poolDiscountPoysha = getFareBreakdown(distanceKm, true).poolDiscountPoysha;

  return {
    pickupZone,
    dropoffZone,
    distanceKm,
    soloFarePoysha,
    pooledFarePoysha,
    poolDiscountPoysha,
  };
};

const requestRide = async (payload: CreateRideRequestInput, passengerId: string) => {
  assertKnownZones(payload.pickupZone, payload.dropoffZone);

  const pickupZone = payload.pickupZone as ZoneKey;
  const dropoffZone = payload.dropoffZone as ZoneKey;
  const distanceKm = getDistanceKm(pickupZone, dropoffZone);
  const estimatedFarePoysha = calculateFare(distanceKm, true);

  const corridor = getCorridorForRoute({ pickupZone, dropoffZone });
  const corridorName = corridor?.name ?? `${pickupZone} -> ${dropoffZone}`;

  const vehicle = await findDriverVehicle();
  const pickup = DHAKA_ZONES[pickupZone];
  const dropoff = DHAKA_ZONES[dropoffZone];

  return prisma.$transaction(async (tx) => {
    // Serialize concurrent requests for the same driver so the pool find-or-create cannot race.
    await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${vehicle.driverId} FOR UPDATE`;

    const rideRequest = await tx.rideRequest.create({
      data: {
        passengerId,
        pickupZone,
        dropoffZone,
        pickupLat: pickup.lat,
        pickupLng: pickup.lng,
        dropoffLat: dropoff.lat,
        dropoffLng: dropoff.lng,
        requestedSeats: payload.requestedSeats,
        estimatedFarePoysha,
        status: RideStatus.REQUESTED,
      },
    });

    let pool = await tx.pool.findFirst({
      where: {
        corridorName,
        vehicleId: vehicle.id,
        status: { in: [PoolStatus.FORMING, PoolStatus.ACTIVE] },
      },
      orderBy: { createdAt: "asc" },
    });

    if (!pool) {
      pool = await tx.pool.create({
        data: {
          vehicleId: vehicle.id,
          driverId: vehicle.driverId,
          corridorName,
          maxCapacity: vehicle.totalCapacity,
        },
      });
    }

    await PoolsService.lockAndAllocateSeats(tx, {
      poolId: pool.id,
      rideRequestId: rideRequest.id,
      requestedSeats: payload.requestedSeats,
      individualFarePoysha: estimatedFarePoysha,
    });

    validateTransition(RideStatus.REQUESTED, RideStatus.MATCHED);

    const matchedRide = await tx.rideRequest.update({
      where: { id: rideRequest.id },
      data: { status: RideStatus.MATCHED },
    });

    await tx.rideEvent.create({
      data: {
        rideRequestId: rideRequest.id,
        fromStatus: RideStatus.REQUESTED,
        toStatus: RideStatus.MATCHED,
        triggeredBy: passengerId,
      },
    });

    const updatedPool = await tx.pool.findUnique({ where: { id: pool.id } });

    return { ride: matchedRide, pool: updatedPool };
  });
};

const getStatus = async (rideId: string, passengerId: string): Promise<RideStatusResult> => {
  const ride = await prisma.rideRequest.findUnique({
    where: { id: rideId },
    include: { poolMembership: { include: { pool: true } } },
  });

  if (!ride) {
    throw new AppError(StatusCodes.NOT_FOUND, `Ride ${rideId} not found`);
  }

  if (ride.passengerId !== passengerId) {
    throw new AppError(StatusCodes.FORBIDDEN, "You cannot view another passenger's ride");
  }

  const {
    id,
    passengerId: ownerId,
    pickupZone,
    dropoffZone: destinationZone,
    requestedSeats,
    status,
    estimatedFarePoysha,
    finalFarePoysha,
    createdAt,
  } = ride;

  return {
    id,
    passengerId: ownerId,
    pickupZone,
    dropoffZone: destinationZone,
    requestedSeats,
    status,
    estimatedFarePoysha,
    finalFarePoysha,
    createdAt,
    pool: ride.poolMembership?.pool ?? null,
  };
};

const cancelRide = async (rideId: string, passengerId: string) => {
  const ride = await prisma.rideRequest.findUnique({ where: { id: rideId } });

  if (!ride) {
    throw new AppError(StatusCodes.NOT_FOUND, `Ride ${rideId} not found`);
  }

  if (ride.passengerId !== passengerId) {
    throw new AppError(StatusCodes.FORBIDDEN, "You cannot cancel another passenger's ride");
  }

  assertCanCancel(ride.status);

  return prisma.$transaction(async (tx) => {
    const membership = await tx.poolMembership.findUnique({ where: { rideRequestId: ride.id } });

    if (membership) {
      await tx.pool.update({
        where: { id: membership.poolId },
        data: { occupiedSeats: { decrement: membership.allocatedSeats } },
      });
      await tx.poolMembership.delete({ where: { id: membership.id } });
    }

    const cancelledRide = await tx.rideRequest.update({
      where: { id: ride.id },
      data: { status: RideStatus.CANCELLED },
    });

    await tx.rideEvent.create({
      data: {
        rideRequestId: ride.id,
        fromStatus: ride.status,
        toStatus: RideStatus.CANCELLED,
        triggeredBy: passengerId,
      },
    });

    return cancelledRide;
  });
};

const getHistory = async (passengerId: string): Promise<RideWithPool[]> =>
  prisma.rideRequest.findMany({
    where: { passengerId },
    orderBy: { createdAt: "desc" },
    include: { poolMembership: { include: { pool: true } } },
  });

export const RidesService = {
  estimate,
  requestRide,
  getStatus,
  cancelRide,
  getHistory,
};