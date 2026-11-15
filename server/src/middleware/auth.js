import jwt from "jsonwebtoken";
import { env } from "../config/index.js";
import { HttpError } from "../utils/http.js";

export const signToken = (u) =>
  jwt.sign({ id: String(u._id), role: u.role, name: u.name, assistantId: u.assistantId ? String(u.assistantId) : null }, env.jwt, { expiresIn: "7d" });

export function auth(req, _res, next) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return next(new HttpError(401, "Please sign in"));
  try {
    req.user = jwt.verify(token, env.jwt);
    next();
  } catch {
    next(new HttpError(401, "Your session expired. Please sign in again"));
  }
}

export const requireRole = (...roles) => (req, _res, next) =>
  roles.includes(req.user.role) ? next() : next(new HttpError(403, "You don't have access to this"));
