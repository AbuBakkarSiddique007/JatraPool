import { StatusCodes } from "http-status-codes";

import { AppError } from "../errors/app.error.js";

export const notFound = (message = "Resource not found"): never => {
  throw new AppError(StatusCodes.NOT_FOUND, message);
};