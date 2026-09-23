import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import { listPersonas, switchPersona } from "./auth.service.js";
import { personaSwitchSchema } from "./auth.validation.js";

export async function getPersonas(_req: Request, res: Response): Promise<void> {
  const personas = await listPersonas();
  res.status(StatusCodes.OK).json({ data: personas });
}

export async function postPersonaSwitch(req: Request, res: Response): Promise<void> {
  const { phone } = personaSwitchSchema.parse(req.body);
  const result = await switchPersona(phone);
  res.status(StatusCodes.OK).json({ data: result });
}