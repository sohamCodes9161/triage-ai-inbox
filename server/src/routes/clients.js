import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import User from "../models/User.js";
import { auth, requireRole } from "../middleware/auth.js";
import { ok, wrap } from "../utils/http.js";

const r = Router();
r.use(auth, requireRole("assistant"));

const pub = (u) => ({ id: u._id, name: u.name, email: u.email, title: u.title });

r.get("/", wrap(async (req, res) => {
  const list = await User.find({ assistantId: req.user.id, role: "client" }).sort({ createdAt: 1 });
  ok(res, list.map(pub));
}));

r.post("/", wrap(async (req, res) => {
  const b = z.object({ name: z.string().min(2), email: z.string().email(), password: z.string().min(6), title: z.string().optional() }).parse(req.body);
  const u = await User.create({ ...b, passwordHash: await bcrypt.hash(b.password, 10), role: "client", assistantId: req.user.id });
  ok(res, pub(u), 201);
}));

export default r;
