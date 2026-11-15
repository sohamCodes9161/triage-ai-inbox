import { Router } from "express";
import { z } from "zod";
import Email from "../models/Email.js";
import User from "../models/User.js";
import { auth, requireRole } from "../middleware/auth.js";
import { ok, wrap, HttpError } from "../utils/http.js";
import { simulateIncoming } from "../services/simulate.js";

const r = Router();
r.use(auth, requireRole("assistant"));

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const CATS = ["assistant_action", "client_action", "fyi", "waiting"];

function buildFilter(userId, q) {
  const f = { assistantId: userId, isArchived: q.archived === "true" };
  if (q.clientId) f.clientId = q.clientId;
  const c = q.category;
  if (CATS.includes(c)) f["triage.category"] = c;
  if (c === "action") Object.assign(f, { "ai.requiresAction": true, isCompleted: false });
  if (c === "meetings") f["ai.hasMeeting"] = true;
  if (c === "important") f.isImportant = true;
  if (c === "general") Object.assign(f, { isImportant: false, "ai.requiresAction": false, "ai.hasMeeting": false });
  if (q.unread === "true") f.isUnread = true;
  if (q.important === "true") f.isImportant = true;
  if (q.needsReview === "true") f["triage.needsReview"] = true;
  if (q.q) {
    const rx = new RegExp(esc(String(q.q)), "i");
    f.$or = [{ subject: rx }, { snippet: rx }, { lastFromName: rx }, { "participants.email": rx }, { "ai.summary": rx }, { "messages.body": rx }];
  }
  return f;
}

const row = (e) => {
  const o = e.toJSON();
  o.clientName = e.clientId?.name;
  o.clientId = e.clientId?._id || e.clientId;
  return o;
};

r.get("/", wrap(async (req, res) => {
  const list = await Email.find(buildFilter(req.user.id, req.query)).sort({ lastMessageAt: -1 }).limit(100)
    .select("-messages -triage.history").populate("clientId", "name");
  ok(res, list.map(row));
}));

r.get("/stats", wrap(async (req, res) => {
  const base = buildFilter(req.user.id, { clientId: req.query.clientId, archived: "false" });
  const n = (extra = {}) => Email.countDocuments({ ...base, ...extra });
  const [total, unread, important, actionRequired, waiting, assistant, client, fyi, needsReview, meetings, general] = await Promise.all([
    n(), n({ isUnread: true }), n({ isImportant: true }), n({ "ai.requiresAction": true, isCompleted: false }),
    n({ "triage.category": "waiting" }), n({ "triage.category": "assistant_action" }), n({ "triage.category": "client_action" }),
    n({ "triage.category": "fyi" }), n({ "triage.needsReview": true }), n({ "ai.hasMeeting": true }),
    n({ isImportant: false, "ai.requiresAction": false, "ai.hasMeeting": false }),
  ]);
  ok(res, { total, unread, important, actionRequired, waiting, assistant, client, fyi, needsReview, meetings, general });
}));

r.post("/simulate-incoming", wrap(async (req, res) => {
  ok(res, await simulateIncoming(req.user.id, req.body?.clientId));
}));

const load = async (req) => {
  const e = await Email.findOne({ _id: req.params.id, assistantId: req.user.id });
  if (!e) throw new HttpError(404, "Conversation not found");
  return e;
};

r.get("/:id", wrap(async (req, res) => {
  const e = await Email.findOne({ _id: req.params.id, assistantId: req.user.id }).populate("clientId", "name email");
  if (!e) throw new HttpError(404, "Conversation not found");
  ok(res, row(e));
}));

r.patch("/:id", wrap(async (req, res) => {
  const b = z.object({ isUnread: z.boolean(), isImportant: z.boolean(), isArchived: z.boolean(), isCompleted: z.boolean() }).partial().parse(req.body);
  const e = await Email.findOneAndUpdate({ _id: req.params.id, assistantId: req.user.id }, { $set: b }, { new: true });
  if (!e) throw new HttpError(404, "Conversation not found");
  ok(res, e);
}));

r.patch("/:id/classification", wrap(async (req, res) => {
  const { category } = z.object({ category: z.enum(CATS) }).parse(req.body);
  const e = await load(req);
  e.triage.history.push({ category: e.triage.category, source: e.triage.source, at: e.triage.classifiedAt || new Date(), by: req.user.name });
  Object.assign(e.triage, { category, confidence: 1, reason: `Manually set by ${req.user.name}.`, source: "manual", needsReview: false, classifiedAt: new Date() });
  const actionable = category === "assistant_action" || category === "client_action";
  e.ai.requiresAction = actionable;
  if (actionable) e.isCompleted = false;
  if (category === "assistant_action") e.clientStatus = "pending";
  await e.save();
  ok(res, e);
}));

r.put("/:id/draft", wrap(async (req, res) => {
  const { body } = z.object({ body: z.string() }).parse(req.body);
  const e = await load(req);
  Object.assign(e.draft, { body, status: body.trim() ? "edited" : "none", updatedAt: new Date() });
  await e.save();
  ok(res, e.draft);
}));

r.post("/:id/draft/approve", wrap(async (req, res) => {
  const { body } = z.object({ body: z.string().min(1, "Write a reply before approving") }).parse(req.body);
  const e = await load(req);
  Object.assign(e.draft, { body, status: "approved", updatedAt: new Date() });
  await e.save();
  ok(res, e.draft);
}));

r.post("/:id/send", wrap(async (req, res) => {
  const e = await load(req);
  if (e.draft.status !== "approved") throw new HttpError(409, "Approve the draft before sending");
  const client = await User.findById(e.clientId);
  const lastIn = [...e.messages].reverse().find((m) => !m.isFromClient) || { from: e.participants[0] };
  const sentAt = new Date();
  e.messages.push({ from: { name: client.name, email: client.email }, to: [lastIn.from], body: e.draft.body, sentAt, isFromClient: true, sentBy: "assistant" });
  Object.assign(e, { lastMessageAt: sentAt, lastFromName: client.name, snippet: e.draft.body.slice(0, 120), isUnread: false });
  e.triage.history.push({ category: e.triage.category, source: e.triage.source, at: e.triage.classifiedAt || sentAt, by: "system" });
  Object.assign(e.triage, { category: "waiting", confidence: 1, reason: "Reply sent. Now waiting for the other party to respond.", source: "system", needsReview: false, classifiedAt: sentAt });
  e.ai.requiresAction = false;
  Object.assign(e.draft, { status: "sent", updatedAt: sentAt });
  await e.save();
  ok(res, e);
}));

export default r;
