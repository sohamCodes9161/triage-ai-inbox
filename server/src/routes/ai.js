import { Router } from "express";
import { z } from "zod";
import Email from "../models/Email.js";
import User from "../models/User.js";
import { auth, requireRole } from "../middleware/auth.js";
import { ok, wrap, HttpError } from "../utils/http.js";
import { aiStatus, reclassify, shouldReanalyse, draftReply, askAboutEmail } from "../services/ai/index.js";

const r = Router();
r.use(auth, requireRole("assistant"));

async function pool(items, n, fn) {
  const out = [];
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (i < items.length) { const k = i++; out[k] = await fn(items[k]); }
  }));
  return out;
}

r.get("/status", wrap(async (_req, res) => ok(res, aiStatus())));

r.post("/triage", wrap(async (req, res) => {
  const { clientId, emailIds } = z.object({ clientId: z.string().optional(), emailIds: z.array(z.string()).optional() }).parse(req.body || {});
  const filter = { assistantId: req.user.id, isArchived: false };
  if (clientId) filter.clientId = clientId;
  if (emailIds?.length) filter._id = { $in: emailIds };
  const all = await Email.find(filter).limit(40);
  const todo = all.filter(shouldReanalyse);
  const names = Object.fromEntries((await User.find({ _id: { $in: [...new Set(todo.map((e) => String(e.clientId)))] } })).map((u) => [String(u._id), u.name]));
  const diff = await pool(todo, 4, (e) => reclassify(e, names[String(e.clientId)] || "the client"));
  ok(res, { ...aiStatus(), processed: todo.length, skipped: all.length - todo.length, diff });
}));

const scoped = async (req) => {
  const e = await Email.findOne({ _id: req.params.id, assistantId: req.user.id });
  if (!e) throw new HttpError(404, "Conversation not found");
  const client = await User.findById(e.clientId);
  return { e, client };
};

r.post("/draft/:id", wrap(async (req, res) => {
  const { tone, instruction } = z.object({ tone: z.string().optional(), instruction: z.string().optional() }).parse(req.body || {});
  const { e, client } = await scoped(req);
  const body = await draftReply(e, { as: "assistant", tone, instruction, clientName: client.name, assistantName: req.user.name });
  Object.assign(e.draft, { body, status: "generated", as: "assistant", updatedAt: new Date() });
  await e.save();
  ok(res, { body, status: "generated", ...aiStatus() });
}));

r.post("/ask/:id", wrap(async (req, res) => {
  const { question } = z.object({ question: z.string().min(2) }).parse(req.body);
  const { e } = await scoped(req);
  ok(res, { answer: await askAboutEmail(e, question) });
}));

export default r;
