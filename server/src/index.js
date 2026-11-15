import mongoose from "mongoose";
import app from "./app.js";
import { env } from "./config/index.js";
import { aiStatus } from "./services/ai/index.js";

mongoose
  .connect(env.mongo)
  .then(() => {
    app.listen(env.port, () => {
      const s = aiStatus();
      console.log(`API on :${env.port} | AI mode: ${s.mode}${s.model ? ` (${s.model})` : ""}`);
    });
  })
  .catch((e) => {
    console.error("MongoDB connection failed:", e.message);
    process.exit(1);
  });
