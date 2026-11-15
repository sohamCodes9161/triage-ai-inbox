// Offline rule-based fallback so the app never breaks without an API key.
const FYI = /(newsletter|unsubscribe|no-?reply|notification|alert|receipt|webinar|digest|confirmation|out of office|automated|no action)/i;
const CLIENT = /(approve|approval|signature|\bsign\b|contract|decision|confidential|board|invest|partnership|equity|\bnda\b|legal|escalat|renewal|personally)/i;
const ASSIST = /(schedul|reschedul|availability|calendar|invoice|book|travel|paperwork|forward|feedback|follow(ing)? up|reimburs|quote|agenda|demo)/i;
const MEETING = /(meeting|call|sync|appointment|demo|schedule|lunch|interview)/i;

const firstSentence = (t) => (t.replace(/\s+/g, " ").match(/^.{20,180}?[.!?](\s|$)/)?.[0] || t.slice(0, 160)).trim();

export function heuristicTriage(email) {
  const msgs = email.messages;
  const last = msgs[msgs.length - 1];
  const text = `${email.subject} ${last.body}`;
  const sender = last.from?.email || "";
  const hasMeeting = MEETING.test(text);
  const base = { source: "heuristic", important: false, hasMeeting, dates: [], actionItems: [] };
  const summary = `${last.from?.name || "Sender"}: ${firstSentence(last.body)}`;

  if (last.isFromClient)
    return { ...base, category: "waiting", confidence: 0.8, reason: "The latest message is from the client side, so the thread is waiting on the other party.", signals: ["last message sent by client side"], summary, requiresAction: false };
  if (FYI.test(text) || FYI.test(sender))
    return { ...base, category: "fyi", confidence: 0.9, reason: "Looks like an automated or informational message that needs no reply.", signals: ["automated wording"], summary, requiresAction: false };
  const c = text.match(CLIENT)?.[0];
  if (c)
    return { ...base, category: "client_action", confidence: 0.8, reason: `Mentions "${c}", which usually needs the client's own decision.`, signals: [c.toLowerCase(), "decision"], summary, requiresAction: true, important: true, actionItems: ["Review and respond personally"] };
  const a = text.match(ASSIST)?.[0];
  if (a)
    return { ...base, category: "assistant_action", confidence: 0.82, reason: `Routine request ("${a}") the assistant can handle.`, signals: [a.toLowerCase(), "routine"], summary, requiresAction: true, actionItems: ["Reply to sender"] };
  const q = text.includes("?");
  return { ...base, category: q ? "assistant_action" : "fyi", confidence: 0.55, reason: "No clear signals found. Please review this classification.", signals: ["ambiguous"], summary, requiresAction: q };
}

export function heuristicDraft(email, { as, clientName, assistantName }) {
  const last = email.messages[email.messages.length - 1];
  const name = (last.from?.name || "there").split(" ")[0];
  const sign = as === "client" ? clientName.split(" ")[0] : `${assistantName}\nOn behalf of ${clientName}`;
  const t = `${email.subject} ${last.body}`.toLowerCase();
  let body;
  if (/(reschedul|schedul|availability|meeting|sync|demo)/.test(t))
    body = `Thanks for reaching out. I'd be glad to find a time. Could you share two or three slots that work for you this week? I'll confirm as soon as I have them.`;
  else if (/invoice|payment|po number/.test(t))
    body = `Thank you for sending this over. I've passed it to our finance team and will confirm the PO number shortly so payment can be processed on schedule.`;
  else if (/approve|approval|sign|contract|proposal|decision/.test(t))
    body = as === "client"
      ? `Thank you for sending this. I've reviewed it and am happy to proceed. Please send over anything else you need from my side.`
      : `Thank you for sending this. I've shared it with ${clientName.split(" ")[0]} for review and will come back to you with a decision shortly.`;
  else body = `Thank you for your message. I'll look into this and get back to you shortly.`;
  return `Hi ${name},\n\n${body}\n\nBest regards,\n${sign}`;
}

export function heuristicAsk(email, question) {
  const last = email.messages[email.messages.length - 1];
  const q = question.toLowerCase();
  if (/(who|from)/.test(q)) return `The latest message is from ${last.from?.name} (${last.from?.email}).`;
  if (/(when|date|deadline|due)/.test(q)) {
    const d = email.ai?.extractedDates || [];
    return d.length ? d.map((x) => `${x.label}: ${new Date(x.date).toDateString()}`).join("; ") : "I couldn't find a date in this thread.";
  }
  if (/(action|todo|need|should)/.test(q)) {
    const a = email.ai?.actionItems || [];
    return a.length ? `Action items: ${a.join("; ")}.` : "No explicit action items were found.";
  }
  return email.ai?.summary || firstSentence(last.body);
}
