import express from "express";
import cors from "cors";
import { env } from "./config/index.js";
import { errorHandler } from "./utils/http.js";
import authRoutes from "./routes/auth.js";
import clientsRoutes from "./routes/clients.js";
import connectionRoutes from "./routes/connections.js";
import emailRoutes from "./routes/emails.js";
import aiRoutes from "./routes/ai.js";
import clientRoutes from "./routes/client.js";
import meetingRoutes from "./routes/meetings.js";

const app = express();
app.use(cors({ origin: env.origins.includes("*") ? true : env.origins }));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => res.json({ data: { ok: true } }));
app.use("/api/auth", authRoutes);
app.use("/api/clients", clientsRoutes);
app.use("/api/connections", connectionRoutes);
app.use("/api/emails", emailRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/client", clientRoutes);
app.use("/api/meetings", meetingRoutes);
app.use((_req, res) => res.status(404).json({ error: "Not found" }));
app.use(errorHandler);

export default app;
