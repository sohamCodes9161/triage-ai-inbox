import { AlertTriangle, Clock, Inbox, MailOpen, Star } from "lucide-react";
import { Skeleton, cx } from "../../components/ui.jsx";

const ITEMS = [
  { key: "total", label: "Total emails", hint: "All synced", icon: Inbox, apply: { category: "all" }, isActive: (f) => f.category === "all" && !f.unread && !f.important && !f.needsReview },
  { key: "unread", label: "Unread", hint: "Needs look", icon: MailOpen, apply: { category: "all", unread: true }, isActive: (f) => f.unread },
  { key: "important", label: "Important", hint: "High priority", icon: Star, apply: { category: "important" }, isActive: (f) => f.category === "important" },
  { key: "actionRequired", label: "Action required", hint: "Needs reply", icon: AlertTriangle, apply: { category: "action" }, isActive: (f) => f.category === "action" },
  { key: "waiting", label: "Waiting", hint: "Follow-ups", icon: Clock, apply: { category: "waiting" }, isActive: (f) => f.category === "waiting" },
];

export default function KpiRow({ stats, loading, filters, onSelect }) {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5 lg:gap-3">
      {ITEMS.map(({ key, label, hint, icon: Icon, apply, isActive }, idx) => {
        const active = isActive(filters);
        const spanLast = idx === ITEMS.length - 1 ? "col-span-2 sm:col-span-1" : "";
        return (
          <button
            key={key}
            onClick={() => onSelect(apply)}
            aria-pressed={active}
            className={cx(
              "group relative overflow-hidden rounded-card border px-3.5 py-3 text-left shadow-card transition-all duration-150",
              spanLast,
              active
                ? "border-accent bg-accent-soft/45 ring-1 ring-accent"
                : "border-line bg-surface hover:-translate-y-0.5 hover:border-line-strong hover:bg-surface-raised"
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-xs font-medium text-secondary">{label}</span>
              <span
                className={cx(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-control transition-colors",
                  active ? "bg-accent text-on-accent" : "bg-muted text-secondary group-hover:text-primary"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
              </span>
            </div>

            {loading && !stats ? (
              <Skeleton className="mt-2.5 h-7 w-12" />
            ) : (
              <div className="mt-2 flex items-baseline justify-between gap-2">
                <p className="font-display text-2xl font-heading tabular-nums text-primary sm:text-3xl">
                  {stats?.[key] ?? 0}
                </p>
                <span className="text-xs text-subtle">{hint}</span>
              </div>
            )}

            {active && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-accent" />}
          </button>
        );
      })}
    </div>
  );
}