import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["assistant", "client"], default: "assistant" },
    title: String,
    assistantId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("User", schema);
