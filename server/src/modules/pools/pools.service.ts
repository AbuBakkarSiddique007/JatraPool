import { PoolMembership, PoolStatus, Prisma } from "@prisma/client";
import { StatusCodes } from "http-status-codes";

import { prisma } from "../../shared/database/prisma.js";
import { AppError } from "../../shared/errors/app.error.js";
import { AllocateSeatInput } from "./pools.interface.js";

type TxClient = Prisma.TransactionClient;

interface PoolLockRow {
  id: string;
  status: PoolStatus;
  occupiedSeats: number;
  maxCapacity: number;
}

const isSeatInputValid = (requestedSeats: number): boolean =>
  Number.isInteger(requestedSeats) && requestedSeats > 0;

const lockAndAllocateSeats = async (
  tx: TxClient,
  input: AllocateSeatInput,
): Promise<PoolMembership> => {
  const { poolId, rideRequestId, requestedSeats, individualFarePoysha } = input;

  if (!isSeatInputValid(requestedSeats)) {
    throw new AppError(StatusCodes.BAD_REQUEST, "requestedSeats must be a positive integer");
  }

  const [pool] = await tx.$queryRaw<PoolLockRow[]>`
    SELECT "id", "status", "occupiedSeats", "maxCapacity"
    FROM "Pool"
    WHERE "id" = ${poolId}
    FOR UPDATE
  `;

  if (!pool) {
    throw new AppError(StatusCodes.NOT_FOUND, `Pool ${poolId} not found`);
  }

  if (pool.status !== PoolStatus.FORMING && pool.status !== PoolStatus.ACTIVE) {
    throw new AppError(StatusCodes.CONFLICT, `Pool is ${pool.status} and no longer accepts seats`);
  }

  const remainingSeats = pool.maxCapacity - pool.occupiedSeats;
  if (requestedSeats > remainingSeats) {
    throw new AppError(
      StatusCodes.CONFLICT,
      `Seat capacity exceeded: only ${remainingSeats} of ${pool.maxCapacity} seats remaining`,
    );
  }

  await tx.pool.update({
    where: { id: poolId },
    data: { occupiedSeats: { increment: requestedSeats } },
  });

  return tx.poolMembership.create({
    data: {
      poolId,
      rideRequestId,
      allocatedSeats: requestedSeats,
      individualFarePoysha,
    },
  });
};

const allocateSeatsInTransaction = (input: AllocateSeatInput): Promise<PoolMembership> =>
  prisma.$transaction((tx) => lockAndAllocateSeats(tx, input));

export const PoolsService = {
  allocateSeatsInTransaction,
  lockAndAllocateSeats,
};