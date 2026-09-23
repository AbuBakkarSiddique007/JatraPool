import { RideStatus } from "@prisma/client";
import { StatusCodes } from "http-status-codes";

import {
  CANCELLABLE_RIDE_STATUSES,
  VALID_RIDE_TRANSITIONS,
} from "../../shared/constants/lifecycle.constant.js";
import { HttpError } from "../../shared/errors/http.error.js";

export function validateTransition(from: RideStatus, to: RideStatus): void {
  const allowed = VALID_RIDE_TRANSITIONS[from];

  if (!allowed || !allowed.includes(to)) {
    throw new HttpError(StatusCodes.BAD_REQUEST, `Invalid ride status transition: ${from} -> ${to}`);
  }
}

export function isCancellable(status: RideStatus): boolean {
  return CANCELLABLE_RIDE_STATUSES.includes(status);
}

export function assertCanCancel(status: RideStatus): void {
  if (!isCancellable(status)) {
    throw new HttpError(StatusCodes.CONFLICT, `Ride in status ${status} can no longer be cancelled`);
  }
}