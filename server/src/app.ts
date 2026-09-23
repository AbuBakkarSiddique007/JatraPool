import express from "express";
import cors from "cors";

import { AuthRoutes } from "./modules/auth/auth.route.js";
import { RidesRoutes } from "./modules/rides/rides.route.js";

const app = express();

app.use(cors());
app.use(express.json());

// Healthcheck endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "JatraPool Backend API" });
});

app.use("/api/auth", AuthRoutes);
app.use("/api/rides", RidesRoutes);

export default app;
