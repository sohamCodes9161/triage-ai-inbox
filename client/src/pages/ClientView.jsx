import { useEffect, useState } from "react";
import { CalendarClock, CheckCheck, ChevronDown, ChevronUp, Flag, PartyPopper, Send, Sparkles, ThumbsUp, Undo2, Wand2 } from "lucide-react";
import { api, errMsg } from "../api/client.js";
import { useFetch } from "../lib/hooks.js";
import { useAuth } from "../context/AuthContext.jsx";
import { Avatar, Button, Card, EmptyState, ErrorState, Skeleton, cx, inputCls, useToast } from "../components/ui.jsx";
import { fmtDate, timeAgo, fmtDateTime } from "../lib/constants.js";

function Thread({ id, clientId }) {
  const { data, loading, error } = useFetch(() => api.get(`/client/emails/${id}`, clientId ? { clientId } : undefined), [id]);
  if (loading) return <Skeleton className="mt-3 h-24" />;
  if (error) return <p className="mt-3 text-sm text-status-client">{error}</p>;
  return (
    <div className="mt-3 space-y-2 border-t border-line pt-3">
      {data.messages.map((m) => (
        <div key={m._id} className={cx("rounded-control p-3 text-sm", m.isFromClient ? "bg-accent-soft" : "bg-muted")}>
          <p className="mb-1 flex justify-between text-xs text-secondary"><span className="font-medium text-primary">{m.from?.name}</span><span>{fmtDateTime(m.sentAt)}</span></p>
          <p className="whitespace-pre-wrap text-primary">{m.body}</p>
        </div>
      ))}
    </div>
  );
}

function Item({ e, clientId, onDone }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [replying, setReplying] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState("");
  const q = clientId ? `?clientId=${clientId}` : "";
  const sender = e.participants?.[0] || {};
  const dates = (e.ai?.extractedDates || []).filter((d) => new Date(d.date) >= new Date(Date.now() - 864e5));

  const act = async (key, fn, msg) => {
    setBusy(key);
    try { const r = await fn(); if (msg) { toast(msg); onDone(); } return r; }
    catch (er) { toast(errMsg(er), "error"); } finally { setBusy(""); }
  };
  const base = `/client/emails/${e._id}`;

  return (
    <Card className="p-card">
      <div className="flex items-start gap-3">
        <Avatar name={sender.name} className="h-10 w-10" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3">
            <p className="text-sm font-medium text-primary">{sender.name}</p>
            <span className="text-xs text-subtle" title={fmtDateTime(e.lastMessageAt)}>{timeAgo(e.lastMessageAt)}</span>
          </div>
          <h2 className="mt-0.5 text-base leading-snug">{e.subject}</h2>
          {e.isImportant && <span className="mt-1 inline-flex items-center gap-1 text-xs text-status-waiting"><Flag className="h-3 w-3" /> Important</span>}
        </div>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-primary">{e.ai?.summary}</p>
      <div className="mt-3 rounded-control bg-accent-soft px-3 py-2.5">
        <p className="flex items-center gap-1.5 text-xs font-medium text-accent"><Sparkles className="h-3.5 w-3.5" /> Why this needs you</p>
        <p className="mt-0.5 text-sm text-primary">{e.triage?.reason}</p>
      </div>
      {dates.length > 0 && <p className="mt-2 flex items-center gap-1.5 text-sm text-secondary"><CalendarClock className="h-4 w-4" />{dates[0].label} · {fmtDate(dates[0].date)}</p>}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="success" onClick={() => act("ok", () => api.post(`${base}/reply${q}`, { body: "Approved. Please go ahead. Thank you." }), "Approved and sent")} loading={busy === "ok"}><ThumbsUp className="h-4 w-4" /> Approve</Button>
        <Button onClick={() => setReplying(!replying)}><Send className="h-4 w-4" /> Reply</Button>
        <Button onClick={() => act("done", () => api.post(`${base}/handled${q}`), "Marked as handled")} loading={busy === "done"}><CheckCheck className="h-4 w-4" /> Mark handled</Button>
        <Button variant="ghost" onClick={() => act("hand", () => api.post(`${base}/handoff${q}`, {}), "Sent back to your assistant")} loading={busy === "hand"}><Undo2 className="h-4 w-4" /> Ask assistant to take over</Button>
      </div>

      {replying && (
        <div className="mt-3 space-y-2">
          <textarea value={text} onChange={(ev) => setText(ev.target.value)} rows={6} placeholder="Write your reply" className={inputCls} aria-label="Reply" />
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => act("draft", async () => { const r = await api.post(`${base}/draft${q}`, {}); setText(r.body); })} loading={busy === "draft"}><Wand2 className="h-4 w-4" /> Draft with AI</Button>
            <Button variant="primary" disabled={!text.trim()} onClick={() => act("send", () => api.post(`${base}/reply${q}`, { body: text }), "Reply sent")} loading={busy === "send"}><Send className="h-4 w-4" /> Send reply</Button>
          </div>
        </div>
      )}

      <button onClick={() => setOpen(!open)} className="mt-3 inline-flex items-center gap-1 text-sm text-accent hover:underline">
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}{open ? "Hide original conversation" : "Open original conversation"}
      </button>
      {open && <Thread id={e._id} clientId={clientId} />}
    </Card>
  );
}

export default function ClientView({ preview = false }) {
  const { user } = useAuth();
  const clients = useFetch(() => (preview ? api.get("/clients") : Promise.resolve([])), [preview]);
  const [clientId, setClientId] = useState("");
  useEffect(() => { if (preview && !clientId && clients.data?.length) setClientId(clients.data[0].id); }, [preview, clients.data, clientId]);

  const list = useFetch(() => (preview && !clientId ? Promise.resolve([]) : api.get("/client/emails", preview ? { clientId } : undefined)), [clientId, preview], { poll: 8000 });
  const name = preview ? clients.data?.find((c) => c.id === clientId)?.name : user.name;
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const n = list.data?.length || 0;

  return (
    <div className="mx-auto max-w-2xl">
      {preview && (
        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-control bg-status-review-soft px-3 py-2 text-sm text-status-review">
          <span>Previewing what your client sees. Actions here update the real data.</span>
          {clients.data?.length > 1 && (
            <select value={clientId} onChange={(e) => setClientId(e.target.value)} className="ml-auto rounded-control border border-line-strong bg-surface px-2 py-1 text-sm text-primary" aria-label="Preview client">
              {clients.data.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
        </div>
      )}
      <h1 className="text-2xl">{greet}{name ? `, ${name.split(" ")[0]}` : ""}</h1>
      <p className="mt-1 text-sm text-secondary">{list.data ? (n ? `${n} ${n === 1 ? "email needs" : "emails need"} your personal attention.` : "Nothing needs you right now.") : "Checking your inbox…"}</p>

      <div className="mt-6 space-y-4">
        {list.loading && !list.data ? [0, 1].map((i) => <Card key={i} className="space-y-3 p-card"><Skeleton className="h-10 w-2/3" /><Skeleton className="h-16" /><Skeleton className="h-9 w-1/2" /></Card>)
          : list.error && !list.data ? <Card><ErrorState message={list.error} onRetry={list.refetch} /></Card>
          : !n ? <Card><EmptyState icon={PartyPopper} title="You're all caught up" text="Your assistant is handling everything else. New items that need you will show up here." /></Card>
          : list.data.map((e) => <Item key={e._id} e={e} clientId={preview ? clientId : ""} onDone={list.reload} />)}
      </div>
    </div>
  );
}
