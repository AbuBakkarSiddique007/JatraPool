import { Pool, PoolMembership, RideRequest } from "@prisma/client";

export interface EstimateInput {
  pickupZone: string;
  dropoffZone: string;
}

export interface EstimateResult {
  pickupZone: string;
  dropoffZone: string;
  distanceKm: number;
  soloFarePoysha: number;
  pooledFarePoysha: number;
  poolDiscountPoysha: number;
}

export interface CreateRideRequestInput {
  pickupZone: string;
  dropoffZone: string;
  requestedSeats: number;
}

export type RideWithPool = RideRequest & {
  poolMembership: (PoolMembership & { pool: Pool }) | null;
};

export type RideStatusResult = Pick<
  RideRequest,
  | "id"
  | "passengerId"
  | "pickupZone"
  | "dropoffZone"
  | "requestedSeats"
  | "status"
  | "estimatedFarePoysha"
  | "finalFarePoysha"
  | "createdAt"
> & { pool: Pool | null };