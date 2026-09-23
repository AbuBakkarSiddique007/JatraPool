import { z } from "zod";

export const estimateSchema = z.object({
  pickupZone: z.string().min(1, "pickupZone is required"),
  dropoffZone: z.string().min(1, "dropoffZone is required"),
});

export const requestRideSchema = z.object({
  pickupZone: z.string().min(1, "pickupZone is required"),
  dropoffZone: z.string().min(1, "dropoffZone is required"),
  requestedSeats: z.number().int().min(1).max(3).default(1),
});

export const rideIdParamsSchema = z.object({
  id: z.string().min(1, "ride id is required"),
});