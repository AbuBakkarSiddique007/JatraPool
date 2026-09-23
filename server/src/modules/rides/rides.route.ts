import { Router } from "express";
import { UserRole } from "@prisma/client";

import { authenticate, requireRole } from "../../shared/middleware/auth.middleware.js";
import { RidesController } from "./rides.controller.js";

const router = Router();

router.post("/estimate", RidesController.estimate);

router.post("/request", authenticate, requireRole(UserRole.PASSENGER), RidesController.requestRide);
router.get("/history", authenticate, requireRole(UserRole.PASSENGER), RidesController.getHistory);
router.get("/:id/status", authenticate, requireRole(UserRole.PASSENGER), RidesController.getStatus);
router.post("/:id/cancel", authenticate, requireRole(UserRole.PASSENGER), RidesController.cancelRide);

export const RidesRoutes = router;