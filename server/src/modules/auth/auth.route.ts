import { Router } from "express";

import { AuthController } from "./auth.controller.js";

const router = Router();

router.get("/personas", AuthController.getPersonas);
router.post("/persona-switch", AuthController.postPersonaSwitch);

export const AuthRoutes = router;