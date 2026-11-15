import Email from "../models/Email.js";
import User from "../models/User.js";
import { INCOMING } from "../seed/emails.seed.js";
import { reclassify } from "./ai/index.js";
import { HttpError } from "../utils/http.js";

// Injects a "new message arrived" event (new thread or reply on an existing one) and triages it.
export async function simulateIncoming(assistantId, clientId) {
  const anchor = await Email.findOne({ assistantId, ...(clientId ? { clientId } : {}) }).sort({ createdAt: -1 });
  if (!anchor) throw new HttpError(400, "Connect an account first so there is an inbox to simulate");
  const client = await User.findById(anchor.clientId);
  const first = client.name.split(" ")[0];
  const me = { name: client.name, email: client.email };
  const tpl = INCOMING[Math.floor(Math.random() * INCOMING.length)];
  const from = { name: tpl.from[0], email: tpl.from[1] };
  const msg = { from, to: [me], body: tpl.body.replaceAll("{{c}}", first), sentAt: new Date(), isFromClient: false };

  let email, kind = "new";
  if (tpl.mode === "reply") {
    email = await Email.findOne({ assistantId, clientId: client._id, subject: new RegExp(tpl.match, "i") });
    if (email) {
      kind = "reply";
      email.messages.push(msg);
      Object.assign(email, { isUnread: true, isCompleted: false, clientStatus: "pending", lastMessageAt: msg.sentAt, lastFromName: from.name, snippet: msg.body.slice(0, 120) });
      if (email.triage.source === "manual") email.triage.source = "pending";
    }
  }
  if (!email) {
    const t = INCOMING.filter((x) => x.mode === "new");
    const nt = tpl.mode === "new" ? tpl : t[Math.floor(Math.random() * t.length)];
    const m = { ...msg, from: { name: nt.from[0], email: nt.from[1] }, body: nt.body.replaceAll("{{c}}", first) };
    email = new Email({
      assistantId, clientId: client._id, connectionId: anchor.connectionId, provider: anchor.provider, threadId: `sim-${Date.now()}`,
      subject: nt.subject, participants: [m.from, me], messages: [m], lastMessageAt: m.sentAt, lastFromName: m.from.name,
      snippet: m.body.slice(0, 120), isUnread: true, triage: { category: "fyi", source: "pending" },
    });
  }
  const diff = await reclassify(email, client.name);
  return { id: String(email._id), subject: email.subject, kind, diff };
}
