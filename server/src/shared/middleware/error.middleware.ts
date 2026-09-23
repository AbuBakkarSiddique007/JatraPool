import { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { StatusCodes } from "http-status-codes";
import { ZodError } from "zod";

import { isAppError } from "../errors/app.error.js";

const getHttpError = (
  error: unknown,
): { statusCode: number; message: string } => {
  if (isAppError(error)) {
    return { statusCode: error.statusCode, message: error.message };
  }

  if (error instanceof ZodError) {
    const issues = error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));

    return {
      statusCode: StatusCodes.BAD_REQUEST,
      message: `Validation error: ${issues.map((issue) => issue.message).join("; ")}`,
    };
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return { statusCode: StatusCodes.CONFLICT, message: "A record with this value already exists" };
    }

    if (error.code === "P2003") {
      return { statusCode: StatusCodes.CONFLICT, message: "Operation violates a foreign key constraint" };
    }

    if (error.code === "P2025") {
      return { statusCode: StatusCodes.NOT_FOUND, message: "The requested record does not exist" };
    }
  }

  return { statusCode: StatusCodes.INTERNAL_SERVER_ERROR, message: "Internal server error" };
};

export const errorHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const { statusCode, message } = getHttpError(error);
  res.status(statusCode).json({ success: false, message });
};