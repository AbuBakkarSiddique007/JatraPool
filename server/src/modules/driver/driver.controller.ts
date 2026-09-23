import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import { catchAsync } from "../../shared/utils/catchAsync.js";
import { sendResponse } from "../../shared/utils/sendResponse.js";
import { poolIdParamsSchema } from "./driver.validation.js";
import { DriverService } from "./driver.service.js";

const onlineToggle = catchAsync(async (req: Request, res: Response) => {
  const result = await DriverService.toggleOnline(req.user!.userId);
  sendResponse(res, {
    httpStatusCode: StatusCodes.OK,
    success: true,
    message: `Driver is now ${result.status}`,
    data: result,
  });
});

const manifest = catchAsync(async (req: Request, res: Response) => {
  const result = await DriverService.getManifest(req.user!.userId);
  sendResponse(res, {
    httpStatusCode: StatusCodes.OK,
    success: true,
    message: "Driver manifest fetched",
    data: result,
  });
});

const advancePool = catchAsync(async (req: Request, res: Response) => {
  const { id } = poolIdParamsSchema.parse(req.params);
  const result = await DriverService.advancePool(id, req.user!.userId);
  sendResponse(res, {
    httpStatusCode: StatusCodes.OK,
    success: true,
    message: "Pool trip advanced",
    data: result,
  });
});

export const DriverController = {
  onlineToggle,
  manifest,
  advancePool,
};