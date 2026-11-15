import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    assistantId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    provider: { type: String, enum: ["gmail", "outlook"], required: true },
    accountEmail: String,
    status: { type: String, enum: ["authorizing", "syncing", "connected", "error"], default: "authorizing" },
    syncProgress: { type: Number, default: 0 },
    emailsSynced: { type: Number, default: 0 },
    lastSyncedAt: Date,
    errorMessage: String,
    isMock: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("AccountConnection", schema);
