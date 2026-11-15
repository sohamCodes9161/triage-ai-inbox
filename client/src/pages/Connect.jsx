import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle2, Mail, Plus, RotateCcw, ShieldCheck, Sparkles } from "lucide-react";
import { api, errMsg } from "../api/client.js";
import { useFetch } from "../lib/hooks.js";
import { Button, Card, Modal, Skeleton, Spinner, cx, inputCls, useToast } from "../components/ui.jsx";
import { PROVIDERS } from "../lib/constants.js";

function ConsentModal({ consent, onAllow, onCancel, busy }) {
  const p = PROVIDERS[consent?.provider];
  return (
    <Modal open={Boolean(consent)} onClose={onCancel} title="Authorize access">
      {consent && (
        <div>
          <div className="mb-3 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-pill bg-accent-soft text-accent"><Mail className="h-5 w-5" /></span>
            <div><h3 className="text-base">Triage wants access to your {p.label} account</h3><p className="text-sm text-secondary">{consent.accountEmail}</p></div>
          </div>
          <p className="mb-2 text-sm text-secondary">Triage will be able to:</p>
          <ul className="mb-4 space-y-1.5">{consent.scopes.map((s) => <li key={s} className="flex items-start gap-2 text-sm text-primary"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-status-success" />{s}</li>)}</ul>
          <p className="mb-4 rounded-control bg-status-review-soft px-3 py-2 text-xs text-status-review">Simulated consent screen. No real {p.label} account is accessed and sample emails are imported instead.</p>
          <div className="flex justify-end gap-2"><Button onClick={onCancel}>Cancel</Button><Button variant="primary" onClick={onAllow} loading={busy}>Allow access</Button></div>
        </div>
      )}
    </Modal>
  );
}

export default function Connect() {
  const nav = useNavigate();
  const toast = useToast();
  const clients = useFetch(() => api.get("/clients"), []);
  const conns = useFetch(() => api.get("/connections"), [], { poll: 0 });
  const [clientId, setClientId] = useState("");
  const [adding, setAdding] = useState(false);
  const [nc, setNc] = useState({ name: "", email: "", password: "" });
  const [consent, setConsent] = useState(null);
  const [busy, setBusy] = useState("");
  const [active, setActive] = useState(null); // connection being synced
  const [stage, setStage] = useState("");     // "sync" | "triage" | "done"
  const timer = useRef(null);

  useEffect(() => { if (!clientId && clients.data?.length) setClientId(clients.data[0].id); }, [clients.data, clientId]);
  useEffect(() => () => clearInterval(timer.current), []);

  const connectedFor = (provider) => conns.data?.find((c) => c.provider === provider && c.clientId === clientId && c.status === "connected");

  async function addClient(e) {
    e.preventDefault();
    setBusy("add");
    try { const c = await api.post("/clients", nc); await clients.refetch(); setClientId(c.id); setAdding(false); setNc({ name: "", email: "", password: "" }); toast("Client added. They can now sign in."); }
    catch (er) { toast(errMsg(er), "error"); } finally { setBusy(""); }
  }

  async function start(provider) {
    setBusy("auth");
    try { setConsent(await api.post(`/connections/${provider}/authorize`, { clientId })); }
    catch (e) { toast(errMsg(e), "error"); } finally { setBusy(""); }
  }

  async function allow() {
    setBusy("allow");
    try {
      await api.post(`/connections/${consent.provider}/callback`, { connectionId: consent.connectionId });
      const id = consent.connectionId;
      setConsent(null); setStage("sync"); setActive({ provider: consent.provider, accountEmail: consent.accountEmail, syncProgress: 0, emailsSynced: 0, status: "syncing" });
      timer.current = setInterval(async () => {
        try {
          const c = await api.get(`/connections/${id}/status`);
          setActive(c);
          if (c.status === "error") { clearInterval(timer.current); toast(c.errorMessage || "Sync failed", "error"); setStage(""); }
          if (c.status === "connected") {
            clearInterval(timer.current); setStage("triage");
            setTimeout(() => { setStage("done"); conns.refetch(); }, 1400);
          }
        } catch { /* keep polling */ }
      }, 700);
    } catch (e) { toast(errMsg(e), "error"); setConsent(null); } finally { setBusy(""); }
  }

  async function reset() {
    if (!confirm("Remove all connected accounts and emails so you can replay the connection flow?")) return;
    try { await api.post("/connections/reset"); setActive(null); setStage(""); await conns.refetch(); toast("Demo data cleared"); } catch (e) { toast(errMsg(e), "error"); }
  }

  const syncing = stage === "sync" || stage === "triage";
  const anyConnected = conns.data?.some((c) => c.status === "connected");

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl">Connect an email account</h1>
      <p className="mt-1 text-sm text-secondary">Choose whose inbox you are managing, then connect their mailbox. This prototype simulates the sign-in and imports realistic sample emails.</p>

      <Card className="mt-6 p-card">
        <h2 className="mb-3 text-sm">1. Client</h2>
        {clients.loading && !clients.data ? <Skeleton className="h-10" /> : (
          <div className="flex flex-wrap items-center gap-2">
            <select value={clientId} onChange={(e) => setClientId(e.target.value)} disabled={syncing} className={cx(inputCls, "max-w-xs")} aria-label="Client">
              {!clients.data?.length && <option value="">No clients yet</option>}
              {clients.data?.map((c) => <option key={c.id} value={c.id}>{c.name}{c.title ? `, ${c.title}` : ""}</option>)}
            </select>
            <Button onClick={() => setAdding(!adding)} disabled={syncing}><Plus className="h-4 w-4" /> Add client</Button>
          </div>
        )}
        {adding && (
          <form onSubmit={addClient} className="mt-4 grid gap-2 sm:grid-cols-3">
            <input required minLength={2} placeholder="Full name" value={nc.name} onChange={(e) => setNc({ ...nc, name: e.target.value })} className={inputCls} />
            <input required type="email" placeholder="Client email (login)" value={nc.email} onChange={(e) => setNc({ ...nc, email: e.target.value })} className={inputCls} />
            <input required minLength={6} type="password" placeholder="Password for client" value={nc.password} onChange={(e) => setNc({ ...nc, password: e.target.value })} className={inputCls} />
            <div className="sm:col-span-3"><Button type="submit" variant="primary" loading={busy === "add"}>Create client login</Button></div>
          </form>
        )}
      </Card>

      <Card className="mt-4 p-card">
        <h2 className="mb-3 text-sm">2. Mailbox</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {Object.entries(PROVIDERS).map(([key, p]) => {
            const done = connectedFor(key);
            return (
              <div key={key} className="rounded-card border border-line p-card">
                <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-control bg-muted text-secondary"><Mail className="h-4 w-4" /></span>
                  <div><p className="text-sm font-medium text-primary">{p.label}</p><p className="text-xs text-secondary">{p.blurb}</p></div></div>
                {done ? (
                  <p className="mt-3 flex items-center gap-1.5 text-sm text-status-success"><CheckCircle2 className="h-4 w-4" /> Connected · {done.emailsSynced} emails</p>
                ) : (
                  <Button className="mt-3 w-full" onClick={() => start(key)} disabled={!clientId || syncing} loading={busy === "auth"}>Connect {p.label}</Button>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {stage && active && (
        <Card className="mt-4 p-card" aria-live="polite">
          <h2 className="mb-3 text-sm">3. Sync</h2>
          <div className="flex items-center justify-between text-sm"><span className="text-primary">{active.accountEmail}</span><span className="text-secondary">{stage === "sync" ? `${active.emailsSynced || 0} emails imported` : stage === "triage" ? "Triaging with AI" : "Complete"}</span></div>
          <div className="mt-2 h-2 overflow-hidden rounded-pill bg-muted"><div className="h-full rounded-pill bg-accent transition-all duration-500" style={{ width: `${stage === "sync" ? active.syncProgress : 100}%` }} /></div>
          <ul className="mt-4 space-y-2 text-sm">
            <li className="flex items-center gap-2 text-primary">{stage === "sync" ? <Spinner className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4 text-status-success" />} Importing conversations</li>
            <li className={cx("flex items-center gap-2", stage === "sync" ? "text-subtle" : "text-primary")}>{stage === "triage" ? <Spinner className="h-4 w-4" /> : stage === "done" ? <CheckCircle2 className="h-4 w-4 text-status-success" /> : <Sparkles className="h-4 w-4" />} Deciding who needs to reply</li>
          </ul>
          {stage === "done" && <Button variant="primary" className="mt-4" onClick={() => nav("/")}>Open dashboard <ArrowRight className="h-4 w-4" /></Button>}
        </Card>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        {anyConnected && !stage && <Button variant="primary" onClick={() => nav("/")}>Go to dashboard <ArrowRight className="h-4 w-4" /></Button>}
        <button onClick={reset} className="ml-auto inline-flex items-center gap-1.5 text-sm text-secondary hover:text-primary"><RotateCcw className="h-3.5 w-3.5" /> Reset demo data</button>
      </div>

      <ConsentModal consent={consent} onAllow={allow} onCancel={() => setConsent(null)} busy={busy === "allow"} />
    </div>
  );
}
