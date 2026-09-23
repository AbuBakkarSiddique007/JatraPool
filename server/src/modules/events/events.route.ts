import { Router } from "express";

import { authenticate } from "../../shared/middleware/auth.middleware.js";
import { EventsController } from "./events.controller.js";

const router = Router();

router.get("/subscribe/:userId", authenticate, EventsController.subscribe);

export const EventsRoutes = router;