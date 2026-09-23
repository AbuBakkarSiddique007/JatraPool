import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import { catchAsync } from "../../shared/utils/catchAsync.js";
import { sendResponse } from "../../shared/utils/sendResponse.js";
import { AuthService } from "./auth.service.js";
import { personaSwitchSchema } from "./auth.validation.js";

const getPersonas = catchAsync(async (_req: Request, res: Response) => {
  const personas = await AuthService.listPersonas();

  sendResponse(res, {
    httpStatusCode: StatusCodes.OK,
    success: true,
    message: "Personas fetched successfully",
    data: personas,
  });
});

const postPersonaSwitch = catchAsync(async (req: Request, res: Response) => {
  const { phone } = personaSwitchSchema.parse(req.body);
  const result = await AuthService.switchPersona(phone);

  sendResponse(res, {
    httpStatusCode: StatusCodes.OK,
    success: true,
    message: "Persona switched successfully",
    data: result,
  });
});

export const AuthController = {
  getPersonas,
  postPersonaSwitch,
};