import { useEffect, useMemo, useRef, useState } from "react";
import { Beaker, Plus, RefreshCw, Search, Sparkles, X } from "lucide-react";
import { api, errMsg } from "../api/client.js";
import { useFetch } from "../lib/hooks.js";
import { Button, cx, inputCls, useToast } from "../components/ui.jsx";
import KpiRow from "../features/kpi/KpiRow.jsx";
import EmailList from "../features/emails/EmailList.jsx";
import Meetings from "../features/meetings/Meetings.jsx";
import ThreadDrawer from "../features/thread/ThreadDrawer.jsx";
import { TABS } from "../lib/constants.js";

const BASE = { category: "all", unread: false, important: false, needsReview: false };

export default function Dashboard() {
  const toast = useToast();
  const [f, setF] = useState({ ...BASE, clientId: "" });
  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState(null);
  const [flashIds, setFlashIds] = useState(new Set());
  const [busy, setBusy] = useState("");
  const flashTimer = useRef(null);

  useEffect(() => { const t = setTimeout(() => setQ(qInput.trim()), 300); return () => clearTimeout(t); }, [qInput]);

  const params = useMemo(() => {
    const p = { category: f.category };
    if (f.clientId) p.clientId = f.clientId;
    if (f.unread) p.unread = true;
    if (f.important) p.important = true;
    if (f.needsReview) p.needsReview = true;
    if (q) p.q = q;
    return p;
  }, [f, q]);

  const key = JSON.stringify(params);
  const clients = useFetch(() => api.get("/clients"), []);
  const ai = useFetch(() => api.get("/ai/status"), []);
  const emails = useFetch(() => api.get("/emails", params), [key], { poll: 10000 });
  const stats = useFetch(() => api.get("/emails/stats", f.clientId ? { clientId: f.clientId } : undefined), [f.clientId], { poll: 10000 });
  const meetings = useFetch(() => api.get("/meetings/upcoming", f.clientId ? { clientId: f.clientId } : undefined), [f.clientId], { poll: 20000 });

  const refreshAll = () => { emails.reload(); stats.reload(); meetings.reload(); };
  const flash = (ids) => {
    setFlashIds(new Set(ids));
    clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlashIds(new Set()), 2600);
  };
  const hasFilters = f.category !== "all" || f.unread || f.important || f.needsReview || q;
  const clear = () => { setF({ ...BASE, clientId: f.clientId }); setQInput(""); };

  async function rerun() {
    setBusy("rerun");
    try {
      const r = await api.post("/ai/triage", { clientId: f.clientId || undefined });
      const changed = r.diff.filter((d) => d.changed);
      flash(changed.map((d) => d.id));
      refreshAll();
      if (!r.processed) toast("Rule-based mode keeps the curated sample results. Add a Grok API key to re-analyse everything live.");
      else toast(`${r.processed} analysed · ${changed.length} reclassified${changed[0] ? ` (e.g. “${changed[0].subject.slice(0, 40)}”)` : ""}`);
    } catch (e) { toast(errMsg(e), "error"); } finally { setBusy(""); }
  }

  async function simulate() {
    setBusy("sim");
    try {
      const r = await api.post("/emails/simulate-incoming", { clientId: f.clientId || undefined });
      flash([r.id]);
      refreshAll();
      const d = r.diff;
      toast(r.kind === "reply" && d.changed ? `New reply on “${r.subject.slice(0, 36)}”: reclassified ${d.from?.replace("_", " ")} → ${d.to.replace("_", " ")}`
        : `New email “${r.subject.slice(0, 44)}” triaged as ${d.to.replace("_", " ")} (${Math.round(d.confidence * 100)}%)`);
    } catch (e) { toast(errMsg(e), "error"); } finally { setBusy(""); }
  }

  const multi = (clients.data?.length || 0) > 1;
  const live = ai.data?.mode === "live";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl">Inbox triage</h1>
          <p className="text-sm text-secondary">Every conversation, sorted by who needs to reply.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {ai.data && (
            <span className={cx("inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-xs font-medium", live ? "bg-status-success-soft text-status-success" : "bg-status-review-soft text-status-review")}
              title={live ? `Using ${ai.data.model}` : "No API key found. Using the rule-based fallback."}>
              {live ? <Sparkles className="h-3 w-3" /> : <Beaker className="h-3 w-3" />}{live ? "AI: Grok live" : "AI: demo mode"}
            </span>
          )}
          <Button onClick={simulate} loading={busy === "sim"}><Plus className="h-4 w-4" /> Simulate incoming email</Button>
          <Button variant="primary" onClick={rerun} loading={busy === "rerun"}><RefreshCw className="h-4 w-4" /> Re-run AI triage</Button>
        </div>
      </div>

      <KpiRow stats={stats.data} loading={stats.loading} filters={f} onSelect={(a) => setF({ ...BASE, clientId: f.clientId, ...a })} />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[12rem] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
          <input value={qInput} onChange={(e) => setQInput(e.target.value)} placeholder="Search senders, subjects and message text" className={cx(inputCls, "pl-9")} aria-label="Search conversations" />
        </div>
        {multi && (
          <select value={f.clientId} onChange={(e) => setF({ ...f, clientId: e.target.value })} className={cx(inputCls, "w-auto")} aria-label="Client">
            <option value="">All clients</option>
            {clients.data.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
        {[["unread", "Unread"], ["important", "Important"], ["needsReview", `Needs review${stats.data?.needsReview ? ` (${stats.data.needsReview})` : ""}`]].map(([k, label]) => (
          <button key={k} onClick={() => setF({ ...f, [k]: !f[k] })} aria-pressed={f[k]}
            className={cx("rounded-pill border px-3 py-1.5 text-sm transition-colors", f[k] ? "border-accent bg-accent-soft text-accent" : "border-line-strong bg-surface text-secondary hover:bg-muted")}>{label}</button>
        ))}
        {hasFilters && <button onClick={clear} className="inline-flex items-center gap-1 text-sm text-secondary hover:text-primary"><X className="h-3.5 w-3.5" /> Clear</button>}
      </div>

      <div className="-mx-4 overflow-x-auto px-4 scrollbar-none" role="tablist" aria-label="Categories">
        <div className="flex min-w-max gap-1 border-b border-line">
          {TABS.map(({ key: k, label, stat, icon: Icon }) => {
            const active = f.category === k;
            return (
              <button key={k} role="tab" aria-selected={active} onClick={() => setF({ ...f, category: k })}
                className={cx("-mb-px inline-flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm transition-colors", active ? "border-accent text-primary" : "border-transparent text-secondary hover:text-primary")}>
                <Icon className="h-4 w-4" />{label}
                <span className={cx("rounded-pill px-1.5 text-xs", active ? "bg-accent-soft text-accent" : "bg-muted text-secondary")}>{stats.data?.[stat] ?? 0}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
        <EmailList emails={emails.data} loading={emails.loading} error={emails.error} onRetry={emails.refetch} onOpen={setOpenId}
          flashIds={flashIds} rerunning={busy === "rerun"} showClient={multi && !f.clientId} onClear={clear} hasFilters={hasFilters} />
        <div className="lg:sticky lg:top-20 lg:self-start"><Meetings data={meetings.data} loading={meetings.loading} onOpen={setOpenId} /></div>
      </div>

      <ThreadDrawer id={openId} onClose={() => setOpenId(null)} onChanged={refreshAll} />
    </div>
  );
}
