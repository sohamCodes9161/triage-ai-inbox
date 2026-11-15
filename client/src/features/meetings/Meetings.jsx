import { CalendarClock, Flag } from "lucide-react";
import { Card, EmptyState, Skeleton } from "../../components/ui.jsx";
import { fmtDate } from "../../lib/constants.js";

export default function Meetings({ data, loading, onOpen }) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-2 border-b border-line px-card py-3">
        <CalendarClock className="h-4 w-4 text-accent" />
        <h2 className="text-sm">Upcoming meetings and deadlines</h2>
      </div>
      {loading && !data ? (
        <div className="space-y-3 p-card">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-10" />)}</div>
      ) : !data?.length ? (
        <EmptyState icon={CalendarClock} title="Nothing scheduled" text="Dates found in emails will show up here." />
      ) : (
        <ul className="divide-y divide-line">
          {data.map((m, i) => (
            <li key={i}>
              <button onClick={() => onOpen(m.emailId)} className="flex w-full items-start gap-3 px-card py-3 text-left hover:bg-muted">
                <span className="mt-0.5 text-subtle">{m.type === "meeting" ? <CalendarClock className="h-4 w-4" /> : <Flag className="h-4 w-4" />}</span>
                <span className="min-w-0">
                  <span className="block truncate text-sm text-primary">{m.label}</span>
                  <span className="block text-xs text-secondary">{fmtDate(m.date)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
