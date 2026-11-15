import { Inbox, UserCog, UserRound, Clock, Zap, CalendarDays, Star, LayoutList, BellOff } from "lucide-react";

// Full class strings so Tailwind can see them. All tokens are semantic.
export const TRIAGE = {
  client_action: { label: "Client Action", short: "Client", cls: "bg-status-client-soft text-status-client", dot: "bg-status-client" },
  assistant_action: { label: "Assistant Action", short: "Assistant", cls: "bg-status-assistant-soft text-status-assistant", dot: "bg-status-assistant" },
  waiting: { label: "Waiting", short: "Waiting", cls: "bg-status-waiting-soft text-status-waiting", dot: "bg-status-waiting" },
  fyi: { label: "FYI", short: "FYI", cls: "bg-status-fyi-soft text-status-fyi", dot: "bg-status-fyi" },
};

export const TABS = [
  { key: "all", label: "All", stat: "total", icon: Inbox },
  { key: "assistant_action", label: "Assistant to reply", stat: "assistant", icon: UserCog },
  { key: "client_action", label: "Client to reply", stat: "client", icon: UserRound },
  { key: "fyi", label: "No reply needed", stat: "fyi", icon: BellOff },
  { key: "action", label: "Action required", stat: "actionRequired", icon: Zap },
  { key: "waiting", label: "Waiting for response", stat: "waiting", icon: Clock },
  { key: "meetings", label: "Meetings", stat: "meetings", icon: CalendarDays },
  { key: "important", label: "Important", stat: "important", icon: Star },
  { key: "general", label: "General", stat: "general", icon: LayoutList },
];

export const PROVIDERS = {
  gmail: { label: "Gmail", blurb: "Google Workspace or personal Gmail" },
  outlook: { label: "Outlook", blurb: "Microsoft 365 or Outlook.com" },
};

export function timeAgo(d) {
  const s = (Date.now() - new Date(d).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)}d ago`;
  return new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
export const fmtDate = (d) => new Date(d).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
export const fmtDateTime = (d) => new Date(d).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
export const initials = (n = "") => n.split(" ").map((x) => x[0]).slice(0, 2).join("").toUpperCase();
