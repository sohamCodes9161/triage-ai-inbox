import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import User from "../models/User.js";
import { auth, signToken } from "../middleware/auth.js";
import { ok, wrap, HttpError } from "../utils/http.js";
import { ensureDemoUsers, ensureDemoEmails } from "../services/demo.js";

const r = Router();
const pub = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role, title: u.title, assistantId: u.assistantId });
const session = (u) => ({ token: signToken(u), user: pub(u) });

r.post("/signup", wrap(async (req, res) => {
  const b = z.object({ name: z.string().min(2), email: z.string().email(), password: z.string().min(6) }).parse(req.body);
  const u = await User.create({ name: b.name, email: b.email, passwordHash: await bcrypt.hash(b.password, 10), role: "assistant" });
  ok(res, session(u), 201);
}));

r.post("/login", wrap(async (req, res) => {
  const b = z.object({ email: z.string().email(), password: z.string().min(1) }).parse(req.body);
  const u = await User.findOne({ email: b.email.toLowerCase() });
  if (!u || !(await bcrypt.compare(b.password, u.passwordHash))) throw new HttpError(401, "Incorrect email or password");
  ok(res, session(u));
}));

r.post("/demo", wrap(async (req, res) => {
  const role = req.body?.role === "client" ? "client" : "assistant";
  const { assistant, client } = await ensureDemoUsers();
  if (role === "client") await ensureDemoEmails(assistant, client);
  ok(res, session(role === "client" ? client : assistant));
}));

r.get("/me", auth, wrap(async (req, res) => {
  const u = await User.findById(req.user.id);
  if (!u) throw new HttpError(401, "Account not found");
  ok(res, pub(u));
}));

export default r;
