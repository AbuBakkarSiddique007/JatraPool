import { RideStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { AppError } from "../../src/shared/errors/app.error.js";
import {
  assertCanCancel,
  isCancellable,
  validateTransition,
} from "../../src/modules/pools/pools.state.js";

const ILLEGAL_TRANSITIONS: Array<[RideStatus, RideStatus]> = [
  [RideStatus.REQUESTED, RideStatus.COMPLETED],
  [RideStatus.MATCHED, RideStatus.STARTED],
  [RideStatus.DRIVER_ARRIVED, RideStatus.COMPLETED],
  [RideStatus.STARTED, RideStatus.CANCELLED],
  [RideStatus.COMPLETED, RideStatus.STARTED],
];

describe("Ride lifecycle state machine", () => {
  it("accepts the happy-path transitions", () => {
    expect(() => validateTransition(RideStatus.REQUESTED, RideStatus.MATCHED)).not.toThrow();
    expect(() => validateTransition(RideStatus.MATCHED, RideStatus.DRIVER_ARRIVED)).not.toThrow();
    expect(() => validateTransition(RideStatus.DRIVER_ARRIVED, RideStatus.STARTED)).not.toThrow();
    expect(() => validateTransition(RideStatus.STARTED, RideStatus.COMPLETED)).not.toThrow();
  });

  it("accepts cancellation only from REQUESTED or MATCHED", () => {
    expect(() => validateTransition(RideStatus.REQUESTED, RideStatus.CANCELLED)).not.toThrow();
    expect(() => validateTransition(RideStatus.MATCHED, RideStatus.CANCELLED)).not.toThrow();
  });

  it("rejects illegal transitions with HTTP 400", () => {
    for (const [from, to] of ILLEGAL_TRANSITIONS) {
      try {
        validateTransition(from, to);
        throw new Error(`expected [${from} -> ${to}] to be rejected`);
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).statusCode).toBe(400);
        expect((error as AppError).message).toContain("Invalid ride status transition");
      }
    }
  });

  it("rejects late cancellations with HTTP 409", () => {
    expect(isCancellable(RideStatus.REQUESTED)).toBe(true);
    expect(isCancellable(RideStatus.MATCHED)).toBe(true);
    expect(isCancellable(RideStatus.DRIVER_ARRIVED)).toBe(false);
    expect(isCancellable(RideStatus.STARTED)).toBe(false);
    expect(() => assertCanCancel(RideStatus.STARTED)).toThrowError(AppError);
  });
});