import { ZodError } from "zod";

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
export const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
export const ok = (res, data, status = 200) => res.status(status).json({ data });

export function errorHandler(err, req, res, _next) {
  if (err instanceof ZodError) {
    const msg = err.issues.map((i) => `${i.path.join(".") || "body"}: ${i.message}`).join("; ");
    return res.status(400).json({ error: msg });
  }
  if (err.name === "CastError") return res.status(400).json({ error: "Invalid id" });
  if (err.code === 11000) return res.status(409).json({ error: "That email is already registered" });
  const status = err.status || 500;
  if (status === 500) console.error(err);
  res.status(status).json({ error: status === 500 ? "Something went wrong on the server" : err.message });
}
