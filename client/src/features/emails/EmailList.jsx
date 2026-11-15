import { ArrowRightLeft, Calendar, Check, CheckCheck, Star, Undo2 } from "lucide-react";
import { Avatar, Card, EmptyState, ErrorState, Skeleton, cx } from "../../components/ui.jsx";
import TriageBadge from "../triage/TriageBadge.jsx";
import { timeAgo } from "../../lib/constants.js";

function Row({ e, selected, onOpen, onQuickReassign, onQuickComplete, flash, busy, showClient }) {
  const sender = e.lastFromName || e.participants?.[0]?.name || "Unknown";
  const nextCategory = e.triage?.category === "client_action" ? "assistant_action" : "client_action";
  const nextLabel = nextCategory === "client_action" ? "To Client" : "To Assistant";

  return (
    <li className={cx("group relative transition-colors", flash && "row-flash", busy && "animate-pulse")}>
      {e.isUnread && <span className="absolute inset-y-2 left-0 w-1 rounded-r-pill bg-accent" aria-hidden="true" />}

      <div
        role="button"
        tabIndex={0}
        onClick={() => onOpen(e._id)}
        onKeyDown={(ev) => ev.key === "Enter" && onOpen(e._id)}
        className={cx(
          "flex cursor-pointer gap-3 px-card py-row transition-colors",
          selected
            ? "bg-accent-soft/50"
            : e.isUnread
            ? "bg-surface hover:bg-surface-raised"
            : "bg-surface/70 hover:bg-surface-raised"
        )}
      >
        <div className="relative pt-0.5">
          <Avatar name={sender} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className={cx("truncate text-sm", e.isUnread ? "font-semibold text-primary" : "text-secondary")}>
              {sender}
              {showClient && e.clientName ? (
                <span className="font-normal text-subtle"> · for {e.clientName.split(" ")[0]}</span>
              ) : null}
            </p>

            {/* Timestamp by default; quick actions on desktop hover */}
            <div className="flex shrink-0 items-center gap-1">
              <span className="text-xs tabular-nums text-subtle group-hover:hidden">
                {timeAgo(e.lastMessageAt)}
              </span>
              <div className="hidden items-center gap-1 group-hover:flex" onClick={(ev) => ev.stopPropagation()}>
                {onQuickReassign && (
                  <button
                    type="button"
                    onClick={() => onQuickReassign(e._id, nextCategory)}
                    title={`Reassign ${nextLabel}`}
                    className="inline-flex items-center gap-1 rounded-control border border-line-strong bg-surface px-2 py-0.5 text-xs font-medium text-secondary shadow-card transition-colors hover:border-accent hover:text-accent"
                  >
                    <ArrowRightLeft className="h-3 w-3" />
                    {nextLabel}
                  </button>
                )}
                {onQuickComplete && !e.isCompleted && (
                  <button
                    type="button"
                    onClick={() => onQuickComplete(e._id)}
                    title="Mark completed"
                    className="inline-flex items-center gap-1 rounded-control border border-line-strong bg-surface px-2 py-0.5 text-xs font-medium text-secondary shadow-card transition-colors hover:border-status-success hover:text-status-success"
                  >
                    <Check className="h-3 w-3" />
                    Done
                  </button>
                )}
              </div>
            </div>
          </div>

          <p className={cx("mt-0.5 truncate text-sm", e.isUnread ? "font-medium text-primary" : "text-primary")}>
            {e.subject}
          </p>
          <p className="mt-0.5 line-clamp-1 text-xs text-secondary">{e.ai?.summary || e.snippet}</p>

          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5">
            <TriageBadge triage={e.triage} />
            {e.isImportant && <Star className="h-3.5 w-3.5 fill-current text-status-waiting" aria-label="Important" />}
            {e.ai?.hasMeeting && <Calendar className="h-3.5 w-3.5 text-subtle" aria-label="Has meeting" />}
            {e.clientStatus === "handled" && (
              <span className="inline-flex items-center gap-1 rounded-pill bg-status-success-soft px-2 py-0.5 text-xs text-status-success">
                <CheckCheck className="h-3 w-3" /> Handled by client
              </span>
            )}
            {e.clientStatus === "handed_back" && (
              <span className="inline-flex items-center gap-1 rounded-pill bg-status-assistant-soft px-2 py-0.5 text-xs text-status-assistant">
                <Undo2 className="h-3 w-3" /> Handed back by client
              </span>
            )}
            {e.isCompleted && e.clientStatus !== "handled" && (
              <span className="rounded-pill bg-status-success-soft px-2 py-0.5 text-xs text-status-success">
                Completed
              </span>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

export default function EmailList({
  emails,
  selectedId,
  loading,
  error,
  onRetry,
  onOpen,
  onQuickReassign,
  onQuickComplete,
  flashIds,
  rerunning,
  showClient,
  onClear,
  hasFilters,
}) {
  return (
    <Card className="overflow-hidden">
      {loading && !emails ? (
        <ul className="divide-y divide-line">
          {[0, 1, 2, 3, 4].map((i) => (
            <li key={i} className="flex gap-3 px-card py-row">
              <Skeleton className="h-8 w-8 rounded-pill" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="h-5 w-32" />
              </div>
            </li>
          ))}
        </ul>
      ) : error && !emails ? (
        <ErrorState message={error} onRetry={onRetry} />
      ) : !emails?.length ? (
        <EmptyState
          title={hasFilters ? "No conversations match" : "Your inbox is clear"}
          text={hasFilters ? "Try a different category or clear your search." : "New emails will appear here after they're triaged."}
          action={
            hasFilters && (
              <button
                onClick={onClear}
                className="rounded-control border border-line-strong px-3 py-1.5 text-sm text-primary hover:bg-muted"
              >
                Clear filters
              </button>
            )
          }
        />
      ) : (
        <ul className="divide-y divide-line">
          {emails.map((e) => (
            <Row
              key={e._id}
              e={e}
              selected={selectedId === e._id}
              onOpen={onOpen}
              onQuickReassign={onQuickReassign}
              onQuickComplete={onQuickComplete}
              flash={flashIds?.has(e._id)}
              busy={rerunning}
              showClient={showClient}
            />
          ))}
        </ul>
      )}
    </Card>
  );
}