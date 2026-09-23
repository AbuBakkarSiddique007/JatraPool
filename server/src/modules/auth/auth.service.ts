import { User } from "@prisma/client";
import { StatusCodes } from "http-status-codes";
import jwt from "jsonwebtoken";

import { envVars } from "../../app/config/env.js";
import { prisma } from "../../shared/database/prisma.js";
import { HttpError } from "../../shared/errors/http.error.js";
import { AuthUserPayload, JwtPayload, PersonaResult } from "./auth.interface.js";

const TOKEN_EXPIRY = "7d";

function toPublicUser(user: User): AuthUserPayload {
  return {
    userId: user.id,
    name: user.name,
    phone: user.phone,
    role: user.role,
  };
}

export async function listPersonas(): Promise<AuthUserPayload[]> {
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
  return users.map(toPublicUser);
}

export async function switchPersona(phone: string): Promise<PersonaResult> {
  const user = await prisma.user.findUnique({ where: { phone } });

  if (!user) {
    throw new HttpError(StatusCodes.NOT_FOUND, `Persona not found for phone ${phone}`);
  }

  const payload: JwtPayload = { userId: user.id, role: user.role };
  const token = jwt.sign(payload, envVars.JWT_SECRET, { expiresIn: TOKEN_EXPIRY });

  return {
    token,
    user: toPublicUser(user),
  };
}