import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import { catchAsync } from "../../shared/utils/catchAsync.js";
import { sendResponse } from "../../shared/utils/sendResponse.js";
import { estimateSchema, requestRideSchema, rideIdParamsSchema } from "./rides.validation.js";
import { RidesService } from "./rides.service.js";

const estimate = catchAsync(async (req: Request, res: Response) => {
  const payload = estimateSchema.parse(req.body);
  const result = await RidesService.estimate(payload);
  sendResponse(res, {
    httpStatusCode: StatusCodes.OK,
    success: true,
    message: "Fare estimate generated",
    data: result,
  });
});

const requestRide = catchAsync(async (req: Request, res: Response) => {
  const payload = requestRideSchema.parse(req.body);
  const result = await RidesService.requestRide(payload, req.user!.userId);
  sendResponse(res, {
    httpStatusCode: StatusCodes.CREATED,
    success: true,
    message: "Ride requested and matched to a pool",
    data: result,
  });
});

const getStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = rideIdParamsSchema.parse(req.params);
  const result = await RidesService.getStatus(id, req.user!.userId);
  sendResponse(res, {
    httpStatusCode: StatusCodes.OK,
    success: true,
    message: "Ride status fetched",
    data: result,
  });
});

const cancelRide = catchAsync(async (req: Request, res: Response) => {
  const { id } = rideIdParamsSchema.parse(req.params);
  const result = await RidesService.cancelRide(id, req.user!.userId);
  sendResponse(res, {
    httpStatusCode: StatusCodes.OK,
    success: true,
    message: "Ride cancelled",
    data: result,
  });
});

const getHistory = catchAsync(async (req: Request, res: Response) => {
  const result = await RidesService.getHistory(req.user!.userId);
  sendResponse(res, {
    httpStatusCode: StatusCodes.OK,
    success: true,
    message: "Ride history fetched",
    data: result,
  });
});

export const RidesController = {
  estimate,
  requestRide,
  getStatus,
  cancelRide,
  getHistory,
};