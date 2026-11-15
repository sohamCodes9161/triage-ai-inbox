import { Router } from "express";
import Email from "../models/Email.js";
import { auth, requireRole } from "../middleware/auth.js";
import { ok, wrap } from "../utils/http.js";

const r = Router();
r.use(auth, requireRole("assistant"));

r.get("/upcoming", wrap(async (req, res) => {
  const now = new Date();
  const f = { assistantId: req.user.id, isArchived: false, "ai.extractedDates.date": { $gte: now } };
  if (req.query.clientId) f.clientId = req.query.clientId;
  const emails = await Email.find(f).select("subject ai.extractedDates");
  const items = emails.flatMap((e) => e.ai.extractedDates.filter((d) => d.date >= now && ["meeting", "deadline"].includes(d.type))
    .map((d) => ({ emailId: e._id, subject: e.subject, label: d.label, date: d.date, type: d.type })));
  items.sort((a, b) => a.date - b.date);
  ok(res, items.slice(0, 8));
}));

export default r;
