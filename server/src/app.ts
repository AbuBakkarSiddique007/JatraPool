import express from "express";
import cors from "cors";

import { AuthRoutes } from "./modules/auth/auth.route.js";
import { DriverRoutes } from "./modules/driver/driver.route.js";
import { EventsRoutes } from "./modules/events/events.route.js";
import { RidesRoutes } from "./modules/rides/rides.route.js";
import { notFoundHandler } from "./shared/middleware/notFound.middleware.js";
import { errorHandler } from "./shared/middleware/error.middleware.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "JatraPool Backend API" });
});

app.use("/api/auth", AuthRoutes);
app.use("/api/rides", RidesRoutes);
app.use("/api/driver", DriverRoutes);
app.use("/api/events", EventsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;