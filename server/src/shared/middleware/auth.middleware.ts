import { NextFunction, Request, RequestHandler, Response } from "express";
import { StatusCodes } from "http-status-codes";
import jwt from "jsonwebtoken";

import { envVars } from "../../app/config/env.js";
import { HttpError } from "../errors/http.error.js";
import { JwtPayload } from "../../modules/auth/auth.interface.js";

function extractBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return null;
  }
  return header.slice("Bearer ".length).trim();
}

export const authenticate: RequestHandler = (req: Request, _res: Response, next: NextFunction) => {
  const token = extractBearerToken(req);

  if (!token) {
    throw new HttpError(StatusCodes.UNAUTHORIZED, "Missing or malformed Authorization header");
  }

  try {
    const payload = jwt.verify(token, envVars.JWT_SECRET) as JwtPayload;
    req.user = { userId: payload.userId, role: payload.role };
    next();
  } catch {
    throw new HttpError(StatusCodes.UNAUTHORIZED, "Invalid or expired token");
  }
};

export const requireRole =
  (...roles: string[]): RequestHandler =>
  (req: Request, _res: Response, next: NextFunction) => {
    const { user } = req;

    if (!user || !roles.includes(user.role)) {
      throw new HttpError(
        StatusCodes.FORBIDDEN,
        "You do not have permission to access this resource",
      );
    }

    next();
  };