import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import { HttpError } from "../errors/http.error.js";

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  next(new HttpError(StatusCodes.NOT_FOUND, `Route not found: ${req.method} ${req.originalUrl}`));
};