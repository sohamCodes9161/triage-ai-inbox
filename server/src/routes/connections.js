import { Router } from "express";
import { z } from "zod";
import AccountConnection from "../models/AccountConnection.js";
import Email from "../models/Email.js";
import User from "../models/User.js";
import { auth, requireRole } from "../middleware/auth.js";
import { ok, wrap, HttpError } from "../utils/http.js";
import { startSync } from "../services/syncService.js";

const r = Router();
r.use(auth, requireRole("assistant"));

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "");

r.get("/", wrap(async (req, res) => {
  const list = await AccountConnection.find({ assistantId: req.user.id }).populate("clientId", "name").sort({ createdAt: -1 });
  ok(res, list.map((c) => ({ ...c.toJSON(), clientName: c.clientId?.name, clientId: c.clientId?._id })));
}));

r.get("/:id/status", wrap(async (req, res) => {
  const c = await AccountConnection.findOne({ _id: req.params.id, assistantId: req.user.id });
  if (!c) throw new HttpError(404, "Connection not found");
  ok(res, c);
}));

// Step 1 of the simulated OAuth flow: returns the consent screen details.
r.post("/:provider/authorize", wrap(async (req, res) => {
  const provider = z.enum(["gmail", "outlook"]).parse(req.params.provider);
  const { clientId } = z.object({ clientId: z.string().min(1) }).parse(req.body);
  const client = await User.findOne({ _id: clientId, assistantId: req.user.id, role: "client" });
  if (!client) throw new HttpError(404, "Client not found");
  const old = await AccountConnection.find({ assistantId: req.user.id, clientId, provider });
  if (old.length) {
    await Email.deleteMany({ connectionId: { $in: old.map((o) => o._id) } });
    await AccountConnection.deleteMany({ _id: { $in: old.map((o) => o._id) } });
  }
  const accountEmail = `${slug(client.name)}@${provider === "gmail" ? "gmail.com" : "outlook.com"}`;
  const conn = await AccountConnection.create({ assistantId: req.user.id, clientId, provider, accountEmail, status: "authorizing" });
  const scopes = provider === "gmail"
    ? ["Read, compose and send email", "View labels and settings"]
    : ["Read and write mail", "Read calendars", "Maintain access to data you've given it access to"];
  ok(res, { connectionId: conn._id, accountEmail, provider, scopes });
}));

// Step 2: the user approved consent, so start the simulated sync.
r.post("/:provider/callback", wrap(async (req, res) => {
  const { connectionId } = z.object({ connectionId: z.string().min(1) }).parse(req.body);
  const conn = await AccountConnection.findOne({ _id: connectionId, assistantId: req.user.id });
  if (!conn) throw new HttpError(404, "Connection not found");
  const client = await User.findById(conn.clientId);
  await AccountConnection.updateOne({ _id: conn._id }, { $set: { status: "syncing", syncProgress: 0, emailsSynced: 0 } });
  startSync(conn, client);
  ok(res, { connectionId: conn._id, status: "syncing" });
}));

r.delete("/:id", wrap(async (req, res) => {
  const c = await AccountConnection.findOne({ _id: req.params.id, assistantId: req.user.id });
  if (!c) throw new HttpError(404, "Connection not found");
  await Email.deleteMany({ connectionId: c._id });
  await c.deleteOne();
  ok(res, { deleted: true });
}));

// Wipes all connections and emails so the onboarding flow can be replayed.
r.post("/reset", wrap(async (req, res) => {
  await Email.deleteMany({ assistantId: req.user.id });
  await AccountConnection.deleteMany({ assistantId: req.user.id });
  ok(res, { reset: true });
}));

export default r;
