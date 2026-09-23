import { RideStatus } from "@prisma/client";

export const RIDE_LIFECYCLE_PHASES: readonly RideStatus[] = [
  RideStatus.REQUESTED,
  RideStatus.MATCHED,
  RideStatus.DRIVER_ARRIVED,
  RideStatus.STARTED,
  RideStatus.COMPLETED,
];

export const CANCELLABLE_RIDE_STATUSES: readonly RideStatus[] = [
  RideStatus.REQUESTED,
  RideStatus.MATCHED,
];

export const VALID_RIDE_TRANSITIONS: Readonly<Record<RideStatus, readonly RideStatus[]>> = {
  [RideStatus.REQUESTED]: [RideStatus.MATCHED, RideStatus.CANCELLED],
  [RideStatus.MATCHED]: [RideStatus.DRIVER_ARRIVED, RideStatus.CANCELLED],
  [RideStatus.DRIVER_ARRIVED]: [RideStatus.STARTED],
  [RideStatus.STARTED]: [RideStatus.COMPLETED],
  [RideStatus.COMPLETED]: [],
  [RideStatus.CANCELLED]: [],
};