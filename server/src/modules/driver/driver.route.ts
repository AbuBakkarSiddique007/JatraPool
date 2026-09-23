import { Router } from "express";
import { UserRole } from "@prisma/client";

import { authenticate, requireRole } from "../../shared/middleware/auth.middleware.js";
import { DriverController } from "./driver.controller.js";

const router = Router();

router.use(authenticate, requireRole(UserRole.DRIVER));

router.post("/online-toggle", DriverController.onlineToggle);
router.get("/manifest", DriverController.manifest);
router.post("/pool/:id/advance", DriverController.advancePool);

export const DriverRoutes = router;