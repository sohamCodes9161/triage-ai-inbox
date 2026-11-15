import { z } from "zod";
import { env } from "../../config/index.js";

export const hasKey = () => Boolean(env.xaiKey);

async function chat(messages, { json = false, temperature = 0.2 } = {}) {
  const res = await fetch(`${env.xaiBase}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${env.xaiKey}` },
    body: JSON.stringify({ model: env.model, messages, temperature, ...(json ? { response_format: { type: "json_object" } } : {}) }),
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`Grok API ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}

export function threadText(email) {
  return email.messages
    .map((m) => `[${new Date(m.sentAt).toISOString()}] ${m.isFromClient ? "CLIENT SIDE" : "EXTERNAL"} - ${m.from?.name} <${m.from?.email}>:\n${m.body}`)
    .join("\n\n");
}

const TriageSchema = z.object({
  category: z.enum(["assistant_action", "client_action", "waiting", "fyi"]),
  confidence: z.coerce.number().min(0).max(1),
  reason: z.string().min(1),
  signals: z.array(z.string()).default([]),
  summary: z.string().min(1),
  requiresAction: z.boolean().default(false),
  important: z.boolean().default(false),
  hasMeeting: z.boolean().default(false),
  actionItems: z.array(z.string()).default([]),
  dates: z.array(z.object({ label: z.string(), date: z.string(), type: z.string().default("deadline") })).default([]),
});

const TRIAGE_SYSTEM = `You are the triage engine of an executive assistant's email dashboard. Decide who must respond to the LATEST message in the thread.
Categories:
- assistant_action: the assistant should reply (scheduling, routine inquiries, administrative or logistics work, invoices, information gathering).
- client_action: the client must personally respond (decisions, approvals, signatures, sensitive, strategic or personal matters).
- waiting: the client side already replied or asked something and the thread now awaits the other party.
- fyi: no reply needed (newsletters, notifications, confirmations, automated mail, general updates).
Do not assign replies unnecessarily. If you are genuinely unsure, set confidence below 0.7.
Respond with ONLY a JSON object: {"category","confidence" (0-1),"reason" (one sentence),"signals" (2-4 short phrases),"summary" (1-2 sentences),"requiresAction" (bool),"important" (bool),"hasMeeting" (bool),"actionItems" (array of strings),"dates" (array of {"label","date" (ISO 8601),"type": "meeting"|"deadline"|"followup"})}.`;

export async function llmTriage(email, clientName) {
  const user = `Today: ${new Date().toISOString()}\nClient: ${clientName}\nSubject: ${email.subject}\n\nThread (oldest first):\n${threadText(email)}`;
  const raw = await chat([{ role: "system", content: TRIAGE_SYSTEM }, { role: "user", content: user }], { json: true });
  const match = raw.match(/\{[\s\S]*\}/);
  const parsed = TriageSchema.parse(JSON.parse(match ? match[0] : raw));
  const dates = parsed.dates.map((d) => ({ ...d, date: new Date(d.date) })).filter((d) => !isNaN(d.date));
  return { ...parsed, dates, source: "llm" };
}

export async function llmDraft(email, { as, tone, instruction, clientName, assistantName }) {
  const who = as === "client"
    ? `You are ${clientName}, replying personally. Sign off with your first name.`
    : `You are ${assistantName}, the personal assistant of ${clientName}, replying on their behalf. Sign off as "${assistantName}, on behalf of ${clientName}".`;
  const sys = `${who} Write a ${tone || "professional"}, concise, warm email reply to the latest message. Output ONLY the email body, with no subject line and no commentary. Never invent facts or commitments that are not in the thread; use placeholders in [brackets] when information is missing.`;
  const user = `Subject: ${email.subject}\n\nThread:\n${threadText(email)}${instruction ? `\n\nExtra instruction: ${instruction}` : ""}`;
  return chat([{ role: "system", content: sys }, { role: "user", content: user }], { temperature: 0.5 });
}

export async function llmAsk(email, question) {
  const sys = "Answer the question using only the email thread provided. Be concise and specific. If the thread does not contain the answer, say so.";
  return chat([{ role: "system", content: sys }, { role: "user", content: `Thread:\n${threadText(email)}\n\nQuestion: ${question}` }]);
}
