import mongoose from "mongoose";
const { Schema } = mongoose;

const person = { name: String, email: String };
const message = new Schema(
  { from: person, to: [person], body: String, sentAt: Date, isFromClient: Boolean, sentBy: String },
  { _id: true }
);

const extractedDate = new Schema(
  {
    label: String,
    date: Date,
    type: String,
  },
  { _id: false }
);


const schema = new Schema(
  {
    assistantId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    clientId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    connectionId: { type: Schema.Types.ObjectId, ref: "AccountConnection" },
    provider: String,
    threadId: String,
    subject: String,
    participants: [person],
    messages: [message],
    lastMessageAt: { type: Date, index: true },
    lastFromName: String,
    snippet: String,

    isUnread: { type: Boolean, default: false },
    isImportant: { type: Boolean, default: false },
    isArchived: { type: Boolean, default: false },
    isCompleted: { type: Boolean, default: false },

    triage: {
      category: { type: String, enum: ["assistant_action", "client_action", "waiting", "fyi"], default: "fyi" },
      confidence: { type: Number, default: 0 },
      reason: String,
      signals: [String],
      needsReview: { type: Boolean, default: false },
      source: { type: String, default: "pending" }, // llm | heuristic | manual | seed | system
      classifiedAt: Date,
      history: [{ category: String, source: String, at: Date, by: String }],
    },
 ai: {
      summary: String,
      extractedDates: [extractedDate],
      hasMeeting: { type: Boolean, default: false },
      requiresAction: { type: Boolean, default: false },
      actionItems: [String],
    },
    draft: {
      body: { type: String, default: "" },
      status: { type: String, enum: ["none", "generated", "edited", "approved", "sent"], default: "none" },
      as: String,
      updatedAt: Date,
    },
    clientStatus: { type: String, enum: ["pending", "handled", "handed_back"], default: "pending" },
    clientNote: String,
  },
  { timestamps: true, toJSON: { virtuals: true, versionKey: false } }
);

export default mongoose.model("Email", schema);
