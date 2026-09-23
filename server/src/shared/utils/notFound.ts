import { StatusCodes } from "http-status-codes";

import { HttpError } from "../errors/http.error.js";

export const notFound = (message = "Resource not found"): never => {
  throw new HttpError(StatusCodes.NOT_FOUND, message);
};