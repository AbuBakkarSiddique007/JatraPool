import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import { AppError } from "../errors/app.error.js";

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  next(new AppError(StatusCodes.NOT_FOUND, `Route not found: ${req.method} ${req.originalUrl}`));
};