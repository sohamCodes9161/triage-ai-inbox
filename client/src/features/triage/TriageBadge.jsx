import { useEffect, useRef, useState } from "react";
import { AlertCircle, Sparkles, UserCheck } from "lucide-react";
import { TRIAGE } from "../../lib/constants.js";
import { cx } from "../../components/ui.jsx";

const SOURCE = { llm: "Analysed by Grok", heuristic: "Rule-based analysis", seed: "Sample AI result", manual: "Set manually", system: "Updated by the app", pending: "Not analysed yet" };

// Triage label + confidence. Click for the reasoning popover.
export default function TriageBadge({ triage, className }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const h = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);
  if (!triage) return null;
  const meta = TRIAGE[triage.category] || TRIAGE.fyi;
  const manual = triage.source === "manual";
  const pct = Math.round((triage.confidence || 0) * 100);

  return (
    <span className={cx("relative inline-block", className)} ref={ref} onClick={(e) => e.stopPropagation()}>
      <button onClick={() => setOpen(!open)} aria-expanded={open} aria-label={`${meta.label}, ${manual ? "set manually" : pct + "% confidence"}. Show reasoning`}
        className={cx("inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-xs font-medium", meta.cls, triage.needsReview && "ring-1 ring-status-review")}>
        {manual ? <UserCheck className="h-3 w-3" /> : <span className={cx("h-1.5 w-1.5 rounded-pill", meta.dot)} />}
        {meta.label}
        {!manual && <span className="opacity-70">{pct}%</span>}
      </button>
      {triage.needsReview && (
        <span className="ml-1.5 inline-flex items-center gap-1 rounded-pill bg-status-review-soft px-2 py-1 text-xs font-medium text-status-review">
          <AlertCircle className="h-3 w-3" /> Review
        </span>
      )}
      {open && (
        <div className="absolute left-0 top-full z-30 mt-2 w-72 rounded-card border border-line bg-surface-raised p-3 text-left shadow-pop">
          <p className="flex items-center gap-1.5 text-xs font-medium text-secondary"><Sparkles className="h-3.5 w-3.5 text-accent" /> Why this label</p>
          <p className="mt-1.5 text-sm text-primary">{triage.reason}</p>
          {triage.signals?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {triage.signals.map((s) => <span key={s} className="rounded-pill bg-muted px-2 py-0.5 text-xs text-secondary">{s}</span>)}
            </div>
          )}
          <div className="mt-3 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-pill bg-muted"><div className={cx("h-full", meta.dot)} style={{ width: `${pct}%` }} /></div>
            <span className="text-xs text-secondary">{pct}% confident</span>
          </div>
          <p className="mt-2 text-xs text-subtle">{SOURCE[triage.source] || "AI result"}{triage.needsReview ? " · Please confirm or change the label" : ""}</p>
        </div>
      )}
    </span>
  );
}
