import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import app from "../../src/app.js";
import { clearRideData, disconnect, login } from "./helpers.js";

describe("Tenant isolation & role guards", () => {
  let nusratToken: string;
  let rafiqToken: string;
  let jashimToken: string;
  let rideId: string;

  beforeAll(async () => {
    await clearRideData();
    nusratToken = await login("+8801700000002");
    rafiqToken = await login("+8801700000003");
    jashimToken = await login("+8801700000001");
  });

  afterAll(async () => {
    await clearRideData();
    await disconnect();
  });

  it("creates a ride for Nusrat", async () => {
    const res = await request(app)
      .post("/api/rides/request")
      .set("Authorization", `Bearer ${nusratToken}`)
      .send({ pickupZone: "BANANI", dropoffZone: "MOHAKHALI", requestedSeats: 1 });

    expect(res.status).toBe(201);
    expect(res.body.data.ride.status).toBe("MATCHED");
    rideId = res.body.data.ride.id;
  });

  it("rejects unauthenticated access to protected endpoints", async () => {
    const view = await request(app).get(`/api/rides/${rideId}/status`);
    expect(view.status).toBe(401);

    const create = await request(app)
      .post("/api/rides/request")
      .send({ pickupZone: "BANANI", dropoffZone: "MOHAKHALI", requestedSeats: 1 });
    expect(create.status).toBe(401);
  });

  it("blocks Rafiq from viewing or cancelling Nusrat's ride", async () => {
    const view = await request(app).get(`/api/rides/${rideId}/status`).set("Authorization", `Bearer ${rafiqToken}`);
    expect(view.status).toBe(403);

    const cancel = await request(app).post(`/api/rides/${rideId}/cancel`).set("Authorization", `Bearer ${rafiqToken}`);
    expect(cancel.status).toBe(403);
  });

  it("blocks a passenger from driver-only endpoints", async () => {
    const manifest = await request(app).get("/api/driver/manifest").set("Authorization", `Bearer ${nusratToken}`);
    expect(manifest.status).toBe(403);
  });

  it("blocks the driver from passenger-only ride endpoints", async () => {
    const create = await request(app)
      .post("/api/rides/request")
      .set("Authorization", `Bearer ${jashimToken}`)
      .send({ pickupZone: "BANANI", dropoffZone: "MOHAKHALI", requestedSeats: 1 });
    expect(create.status).toBe(403);
  });

  it("allows the ride owner to cancel", async () => {
    const cancel = await request(app).post(`/api/rides/${rideId}/cancel`).set("Authorization", `Bearer ${nusratToken}`);
    expect(cancel.status).toBe(200);
    expect(cancel.body.data.status).toBe("CANCELLED");
  });
});