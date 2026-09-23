import { Router } from "express";

import { catchAsync } from "../../shared/utils/catchAsync.js";
import { getPersonas, postPersonaSwitch } from "./auth.controller.js";

const authRouter = Router();

authRouter.get("/personas", catchAsync(getPersonas));
authRouter.post("/persona-switch", catchAsync(postPersonaSwitch));

export default authRouter;