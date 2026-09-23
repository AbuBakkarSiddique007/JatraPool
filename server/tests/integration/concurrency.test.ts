import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import app from "../../src/app.js";
import { prisma } from "../../src/shared/database/prisma.js";
import { clearRideData, disconnect, login } from "./helpers.js";

describe("Concurrency: Bullet seat race (Nusrat 2 vs Shirin 2)", () => {
  let nusratToken: string;
  let shirinToken: string;

  beforeAll(async () => {
    await clearRideData();
    nusratToken = await login("+8801700000002");
    shirinToken = await login("+8801700000004");
  });

  afterAll(async () => {
    await clearRideData();
    await disconnect();
  });

  it("accepts exactly one of two parallel 2-seat requests and never overbooks", async () => {
    const [nusratRes, shirinRes] = await Promise.all([
      request(app)
        .post("/api/rides/request")
        .set("Authorization", `Bearer ${nusratToken}`)
        .send({ pickupZone: "BANANI", dropoffZone: "MOHAKHALI", requestedSeats: 2 }),
      request(app)
        .post("/api/rides/request")
        .set("Authorization", `Bearer ${shirinToken}`)
        .send({ pickupZone: "BANANI", dropoffZone: "MOHAKHALI", requestedSeats: 2 }),
    ]);

    const statuses = [nusratRes.status, shirinRes.status].sort();
    expect(statuses).toEqual([201, 409]);

    const winner = nusratRes.status === 201 ? nusratRes : shirinRes;
    const loser = nusratRes.status === 201 ? shirinRes : nusratRes;

    expect(winner.body.success).toBe(true);
    expect(winner.body.data.ride.status).toBe("MATCHED");
    expect(winner.body.data.pool.occupiedSeats).toBe(2);

    expect(loser.body.success).toBe(false);
    expect(loser.body.message).toMatch(/Seat capacity exceeded/);

    const pool = await prisma.pool.findUnique({ where: { id: winner.body.data.pool.id } });
    expect(pool).not.toBeNull();
    expect(pool!.occupiedSeats).toBeLessThanOrEqual(pool!.maxCapacity);
  });
});