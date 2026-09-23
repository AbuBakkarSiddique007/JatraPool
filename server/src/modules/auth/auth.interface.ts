import { UserRole } from "@prisma/client";

export interface AuthUserPayload {
  userId: string;
  name: string;
  phone: string;
  role: UserRole;
}

export interface JwtPayload {
  userId: string;
  role: UserRole;
}

export interface PersonaResult {
  token: string;
  user: AuthUserPayload;
}