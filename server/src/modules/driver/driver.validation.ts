import { z } from "zod";

export const poolIdParamsSchema = z.object({
  id: z.string().min(1, "pool id is required"),
});