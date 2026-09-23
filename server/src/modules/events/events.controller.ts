import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import { AppError } from "../../shared/errors/app.error.js";
import { catchAsync } from "../../shared/utils/catchAsync.js";
import { EventsService } from "./events.service.js";
import { userIdParamsSchema } from "./events.validation.js";

const setSseHeaders = (res: Response): void => {
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.flushHeaders();
};

const subscribe = catchAsync(async (req: Request, res: Response) => {
  const { userId } = userIdParamsSchema.parse(req.params);

  if (userId !== req.user!.userId) {
    throw new AppError(StatusCodes.FORBIDDEN, "You cannot subscribe to another user's stream");
  }

  setSseHeaders(res);
  res.write(": connected\n\n");
  await EventsService.publishSnapshot(userId, res);
  EventsService.subscribe(userId, res);
});

export const EventsController = {
  subscribe,
};