import { Router } from "express";
import { z } from "zod";
import Email from "../models/Email.js";
import User from "../models/User.js";
import { auth } from "../middleware/auth.js";
import { ok, wrap, HttpError } from "../utils/http.js";
import { draftReply } from "../services/ai/index.js";

const r = Router();
r.use(auth);

// Clients only see their own mail. Assistants may preview a client's view via ?clientId=.
const scope = (req) => {
  if (req.user.role === "client") return { clientId: req.user.id };
  const f = { assistantId: req.user.id };
  if (req.query.clientId) f.clientId = req.query.clientId;
  return f;
};
const load = async (req) => {
  const e = await Email.findOne({ _id: req.params.id, ...scope(req) });
  if (!e) throw new HttpError(404, "Conversation not found");
  return e;
};
const who = (req) => (req.user.role === "client" ? "client" : `${req.user.name} (preview)`);
const pushHistory = (e, by) => e.triage.history.push({ category: e.triage.category, source: e.triage.source, at: e.triage.classifiedAt || new Date(), by });

r.get("/emails", wrap(async (req, res) => {
  const list = await Email.find({ ...scope(req), "triage.category": "client_action", isArchived: false, isCompleted: false, clientStatus: { $ne: "handled" } })
    .sort({ isImportant: -1, lastMessageAt: -1 })
    .select("subject snippet lastMessageAt lastFromName participants isImportant isUnread triage.reason triage.confidence ai.summary ai.extractedDates ai.actionItems");
  ok(res, list.map((e) => e.toJSON()));
}));

r.get("/emails/:id", wrap(async (req, res) => ok(res, (await load(req)).toJSON())));

r.post("/emails/:id/handled", wrap(async (req, res) => {
  const e = await load(req);
  pushHistory(e, who(req));
  Object.assign(e, { clientStatus: "handled", isCompleted: true, isUnread: false });
  await e.save();
  ok(res, { ok: true });
}));

r.post("/emails/:id/handoff", wrap(async (req, res) => {
  const { note } = z.object({ note: z.string().optional() }).parse(req.body || {});
  const e = await load(req);
  pushHistory(e, who(req));
  Object.assign(e.triage, { category: "assistant_action", confidence: 1, reason: "The client asked the assistant to take over.", source: "manual", needsReview: false, classifiedAt: new Date() });
  Object.assign(e, { clientStatus: "handed_back", clientNote: note || "", isUnread: true });
  e.ai.requiresAction = true;
  await e.save();
  ok(res, { ok: true });
}));

r.post("/emails/:id/draft", wrap(async (req, res) => {
  const e = await load(req);
  const client = await User.findById(e.clientId);
  const body = await draftReply(e, { as: "client", tone: req.body?.tone, instruction: req.body?.instruction, clientName: client.name, assistantName: "" });
  ok(res, { body });
}));

r.post("/emails/:id/reply", wrap(async (req, res) => {
  const { body } = z.object({ body: z.string().min(1, "Write a reply first") }).parse(req.body);
  const e = await load(req);
  const client = await User.findById(e.clientId);
  const lastIn = [...e.messages].reverse().find((m) => !m.isFromClient) || { from: e.participants[0] };
  const sentAt = new Date();
  e.messages.push({ from: { name: client.name, email: client.email }, to: [lastIn.from], body, sentAt, isFromClient: true, sentBy: "client" });
  pushHistory(e, who(req));
  Object.assign(e.triage, { category: "waiting", confidence: 1, reason: "The client replied. Waiting for the other party.", source: "system", needsReview: false, classifiedAt: sentAt });
  Object.assign(e, { lastMessageAt: sentAt, lastFromName: client.name, snippet: body.slice(0, 120), clientStatus: "handled", isUnread: false });
  e.ai.requiresAction = false;
  Object.assign(e.draft, { status: "sent", body, updatedAt: sentAt });
  await e.save();
  ok(res, { ok: true });
}));

export default r;
