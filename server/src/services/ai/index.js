import { env } from "../../config/index.js";
import { hasKey, llmTriage, llmDraft, llmAsk } from "./llm.js";
import { heuristicTriage, heuristicDraft, heuristicAsk } from "./heuristic.js";

export const aiStatus = () => ({ mode: hasKey() ? "live" : "mock", provider: hasKey() ? "xAI Grok" : "rule-based", model: hasKey() ? env.model : null });

async function triageEmail(email, clientName) {
  if (hasKey()) {
    try {
      return await llmTriage(email, clientName);
    } catch (e) {
      console.warn("[ai] Grok triage failed, using fallback:", e.message);
    }
  }
  return heuristicTriage(email);
}

// Classifies a thread, stores the result on the document and returns a diff entry.
export async function reclassify(email, clientName) {
  const r = await triageEmail(email, clientName);
  const prev = email.triage || {};
  const history = [...(prev.history || [])];
  if (prev.category && prev.source !== "pending")
    history.push({ category: prev.category, source: prev.source, at: prev.classifiedAt || new Date(), by: "ai" });
  email.triage = {
    category: r.category, confidence: r.confidence, reason: r.reason, signals: r.signals,
    needsReview: r.confidence < 0.7, source: r.source, classifiedAt: new Date(), history: history.slice(-10),
  };
  email.ai = {
    summary: r.summary, extractedDates: r.dates, hasMeeting: r.hasMeeting,
    requiresAction: r.category === "fyi" ? false : r.category === "waiting" ? Boolean(r.requiresAction) : true,
    actionItems: r.actionItems,
  };
  if (r.important) email.isImportant = true;
  await email.save();
  return { id: String(email._id), subject: email.subject, from: prev.category || null, to: r.category, confidence: r.confidence, changed: prev.category !== r.category };
}

// Mock mode keeps curated seed results; live mode re-analyses everything except manual overrides.
export const shouldReanalyse = (email) => email.triage.source !== "manual" && (hasKey() || !["seed", "manual"].includes(email.triage.source));

export async function draftReply(email, opts) {
  if (hasKey()) {
    try {
      return await llmDraft(email, opts);
    } catch (e) {
      console.warn("[ai] Grok draft failed, using fallback:", e.message);
    }
  }
  return heuristicDraft(email, opts);
}

export async function askAboutEmail(email, question) {
  if (hasKey()) {
    try {
      return await llmAsk(email, question);
    } catch (e) {
      console.warn("[ai] Grok ask failed, using fallback:", e.message);
    }
  }
  return heuristicAsk(email, question);
}
