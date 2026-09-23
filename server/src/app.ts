import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

// Healthcheck endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "JatraPool Backend API" });
});

export default app;
