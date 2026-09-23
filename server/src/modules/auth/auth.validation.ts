import { z } from "zod";

export const personaSwitchSchema = z.object({
  phone: z.string().min(1, "phone is required"),
});

export type PersonaSwitchInput = z.infer<typeof personaSwitchSchema>;