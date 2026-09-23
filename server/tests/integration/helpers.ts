import request from "supertest";
import { expect } from "vitest";

import app from "../../src/app.js";
import { prisma } from "../../src/shared/database/prisma.js";

export const login = async (phone: string): Promise<string> => {
  const res = await request(app).post("/api/auth/persona-switch").send({ phone });
  expect(res.status).toBe(200);
  return res.body.data.token as string;
};

export const clearRideData = async (): Promise<void> => {
  await prisma.$transaction([
    prisma.poolMembership.deleteMany({}),
    prisma.rideEvent.deleteMany({}),
    prisma.rideRequest.deleteMany({}),
    prisma.pool.deleteMany({}),
  ]);
};

export const disconnect = async (): Promise<void> => {
  await prisma.$disconnect();
};