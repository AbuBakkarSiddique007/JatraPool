import { z } from "zod";

export const userIdParamsSchema = z.object({
  userId: z.string().min(1, "userId is required"),
});