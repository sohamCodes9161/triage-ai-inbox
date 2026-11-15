import dotenv from "dotenv";
dotenv.config();

export const env = {
  port: process.env.PORT || 5000,
  mongo: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/triage",
  jwt: process.env.JWT_SECRET || "dev-secret",
  origins: (process.env.CLIENT_ORIGIN || "http://localhost:5173").split(",").map((s) => s.trim()),
  xaiKey: process.env.XAI_API_KEY || "",
  xaiBase: process.env.XAI_BASE_URL || "https://api.x.ai/v1",
  model: process.env.GROK_MODEL || "grok-4-fast",
};
