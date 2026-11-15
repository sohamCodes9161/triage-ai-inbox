import { useEffect, useState } from "react";
import {
  Archive,
  ArchiveRestore,
  CalendarClock,
  Check,
  CheckCircle2,
  Flag,
  ListChecks,
  Mail,
  Send,
  Sparkles,
  Star,
  Wand2,
  X,
} from "lucide-react";
import { api, errMsg } from "../../api/client.js";
import { useFetch } from "../../lib/hooks.js";
import { Avatar, Button, Card, Drawer, ErrorState, Skeleton, cx, inputCls, useToast } from "../../components/ui.jsx";
import TriageBadge from "../triage/TriageBadge.jsx";
import { TRIAGE, fmtDate, fmtDateTime } from "../../lib/constants.js";

const TONES = ["professional", "friendly", "concise", "formal"];

function IconBtn({ label, active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-pressed={active}
      className={cx("rounded-control p-2 transition-colors hover:bg-muted", active ? "text-accent" : "text-secondary")}
    >
      {children}
    </button>
  );
}

function Body({ id, onClose, onChanged }) {
  const toast = useToast();
  const { data: email, loading, error, refetch } = useFetch(() => api.get(`/emails/${id}`), [id]);
  const [draft, setDraft] = useState("");
  const [tone, setTone] = useState("professional");
  const [busy, setBusy] = useState("");
  const [q, setQ] = useState("");
  const [answer, setAnswer] = useState(null);

  useEffect(() => {
    if (!email) return;
    setDraft(email.draft?.body || "");
    setAnswer(null);
    if (email.isUnread) api.patch(`/emails/${id}`, { isUnread: false }).then(() => onChanged?.()).catch(() => {});
  }, [email?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  const run = async (key, fn, okMsg) => {
    setBusy(key);
    try {
      const r = await fn();
      if (okMsg) toast(okMsg);
      return r;
    } catch (e) {
      toast(errMsg(e), "error");
    } finally {
      setBusy("");
    }
  };
  const patch = (body, msg) =>
    run(
      "patch",
      async () => {
        await api.patch(`/emails/${id}`, body);
        await refetch();
        onChanged?.();
      },
      msg
    );

  if (loading && !email)
    return (
      <div className="space-y-4 p-card">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-24" />
        <Skeleton className="h-40" />
      </div>
    );
  if (error && !email) return <ErrorState message={error} onRetry={refetch} />;
  if (!email) return null;

  const saved = email.draft?.body || "";
  const approved = email.draft?.status === "approved" && draft === saved;
  const sent = email.draft?.status === "sent";

  const reclassify = (category) =>
    run(
      "class",
      async () => {
        await api.patch(`/emails/${id}/classification`, { category });
        await refetch();
        onChanged?.();
      },
      "Classification updated"
    );
  const generate = () =>
    run(
      "gen",
      async () => {
        const r = await api.post(`/ai/draft/${id}`, { tone });
        setDraft(r.body);
        await refetch();
      },
      "Draft ready. Review it before sending."
    );
  const approve = () =>
    run(
      "approve",
      async () => {
        await api.post(`/emails/${id}/draft/approve`, { body: draft });
        await refetch();
      },
      "Draft approved"
    );
  const send = () =>
    run(
      "send",
      async () => {
        await api.post(`/emails/${id}/send`);
        await refetch();
        onChanged?.();
        setDraft("");
      },
      "Reply sent (simulated)"
    );
  const ask = (ev) => {
    ev.preventDefault();
    if (q.trim().length < 2) return;
    run("ask", async () => setAnswer(await api.post(`/ai/ask/${id}`, { question: q })));
  };
  const saveDraft = () => {
    if (draft !== saved && !approved && draft.trim()) api.put(`/emails/${id}/draft`, { body: draft }).catch(() => {});
  };

  return (
    <div className="pb-8">
      <div className="sticky top-0 z-10 flex items-start gap-2 border-b border-line bg-surface-raised px-card py-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-heading leading-snug sm:text-lg">{email.subject}</h2>
          <p className="mt-0.5 text-xs text-secondary">
            For {email.clientName || "client"} · {email.provider === "outlook" ? "Outlook" : "Gmail"}
          </p>
        </div>
        <div className="flex shrink-0 items-center">
          <IconBtn
            label={email.isImportant ? "Remove important" : "Mark important"}
            active={email.isImportant}
            onClick={() => patch({ isImportant: !email.isImportant })}
          >
            <Star className={cx("h-4 w-4", email.isImportant && "fill-current")} />
          </IconBtn>
          <IconBtn label="Mark as unread" onClick={() => patch({ isUnread: true }, "Marked unread").then(onClose)}>
            <Mail className="h-4 w-4" />
          </IconBtn>
          <IconBtn
            label={email.isArchived ? "Unarchive" : "Archive"}
            onClick={() =>
              patch({ isArchived: !email.isArchived }, email.isArchived ? "Unarchived" : "Archived").then(
                () => !email.isArchived && onClose()
              )
            }
          >
            {email.isArchived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
          </IconBtn>
          <IconBtn
            label={email.isCompleted ? "Reopen" : "Mark completed"}
            active={email.isCompleted}
            onClick={() => patch({ isCompleted: !email.isCompleted }, email.isCompleted ? "Reopened" : "Marked completed")}
          >
            <CheckCircle2 className="h-4 w-4" />
          </IconBtn>
          <IconBtn label="Close" onClick={onClose}>
            <X className="h-4 w-4" />
          </IconBtn>
        </div>
      </div>

      <div className="space-y-4 px-card pt-4">
        {/* AI analysis */}
        <section className="rounded-card border border-line bg-surface p-card">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <TriageBadge triage={email.triage} />
            <label className="flex items-center gap-2 text-xs text-secondary">
              Change to
              <select
                value=""
                disabled={busy === "class"}
                onChange={(e) => e.target.value && reclassify(e.target.value)}
                className="rounded-control border border-line-strong bg-surface px-2 py-1 text-xs text-primary"
              >
                <option value="">Select…</option>
                {Object.entries(TRIAGE)
                  .filter(([k]) => k !== email.triage.category)
                  .map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label}
                    </option>
                  ))}
              </select>
            </label>
          </div>
          <p className="mt-3 flex items-start gap-2 text-sm text-primary">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            {email.ai?.summary}
          </p>
          {email.ai?.actionItems?.length > 0 && (
            <div className="mt-3">
              <p className="flex items-center gap-1.5 text-xs font-medium text-secondary">
                <ListChecks className="h-3.5 w-3.5" /> Action items
              </p>
              <ul className="mt-1 list-disc pl-8 text-sm text-primary">
                {email.ai.actionItems.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </div>
          )}
          {email.ai?.extractedDates?.length > 0 && (
            <div className="mt-3 space-y-1">
              {email.ai.extractedDates.map((d, i) => (
                <p key={i} className="flex items-center gap-2 text-sm text-secondary">
                  {d.type === "meeting" ? (
                    <CalendarClock className="h-4 w-4 text-accent" />
                  ) : (
                    <Flag className="h-4 w-4 text-status-waiting" />
                  )}
                  <span className="text-primary">{d.label}</span> · {fmtDate(d.date)}
                </p>
              ))}
            </div>
          )}
          {email.clientStatus === "handed_back" && (
            <p className="mt-3 rounded-control bg-status-assistant-soft px-3 py-2 text-sm text-status-assistant">
              The client asked you to take this over.{email.clientNote ? ` Note: "${email.clientNote}"` : ""}
            </p>
          )}
          {email.clientStatus === "handled" && (
            <p className="mt-3 rounded-control bg-status-success-soft px-3 py-2 text-sm text-status-success">
              The client has handled this conversation.
            </p>
          )}
        </section>

        {/* Conversation */}
        <section>
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-secondary">
            Conversation · {email.messages.length} {email.messages.length === 1 ? "message" : "messages"}
          </h3>
          <div className="space-y-3">
            {email.messages.map((m) => (
              <article
                key={m._id}
                className={cx(
                  "rounded-card border p-card",
                  m.isFromClient ? "border-accent/30 bg-accent-soft/50" : "border-line bg-surface"
                )}
              >
                <header className="flex items-center gap-2.5">
                  <Avatar name={m.from?.name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-primary">
                      {m.from?.name}
                      {m.sentBy === "assistant" && <span className="font-normal text-secondary"> (sent by assistant)</span>}
                    </p>
                    <p className="truncate text-xs text-secondary">{m.from?.email}</p>
                  </div>
                  <time className="shrink-0 text-xs tabular-nums text-subtle">{fmtDateTime(m.sentAt)}</time>
                </header>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-primary">{m.body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Ask AI */}
        <section className="rounded-card border border-line bg-surface p-card">
          <h3 className="mb-2 text-sm font-medium text-primary">Ask about this conversation</h3>
          <form onSubmit={ask} className="flex gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="What does the sender need from us?"
              className={inputCls}
            />
            <Button type="submit" loading={busy === "ask"}>
              Ask
            </Button>
          </form>
          {answer && <p className="mt-3 rounded-control bg-muted px-3 py-2 text-sm text-primary">{answer.answer}</p>}
        </section>

        {/* Reply */}
        <section className="rounded-card border border-line bg-surface p-card">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-medium text-primary">Reply</h3>
            {sent ? (
              <span className="inline-flex items-center gap-1 text-xs text-status-success">
                <Check className="h-3.5 w-3.5" /> Sent
              </span>
            ) : approved ? (
              <span className="inline-flex items-center gap-1 text-xs text-status-success">
                <Check className="h-3.5 w-3.5" /> Approved
              </span>
            ) : draft ? (
              <span className="text-xs text-status-waiting">Needs your review</span>
            ) : null}
          </div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="rounded-control border border-line-strong bg-surface px-2 py-1.5 text-xs text-primary"
              aria-label="Tone"
            >
              {TONES.map((t) => (
                <option key={t} value={t}>
                  {t[0].toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
            <Button size="sm" onClick={generate} loading={busy === "gen"}>
              <Wand2 className="h-3.5 w-3.5" /> {draft ? "Regenerate with AI" : "Draft with AI"}
            </Button>
          </div>
          {busy === "gen" ? (
            <div className="space-y-2 py-2">
              <Skeleton className="h-4" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ) : (
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={saveDraft}
              rows={7}
              placeholder="Write a reply, or let AI draft one. Nothing is sent until you approve it."
              className={cx(inputCls, "leading-relaxed")}
            />
          )}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-subtle">AI drafts are never sent automatically.</p>
            <div className="flex gap-2">
              <Button onClick={approve} disabled={!draft.trim() || approved} loading={busy === "approve"}>
                <Check className="h-4 w-4" /> Approve
              </Button>
              <Button variant="primary" onClick={send} disabled={!approved} loading={busy === "send"}>
                <Send className="h-4 w-4" /> Send reply
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default function ThreadDrawer({ id, onClose, onChanged, inline = false }) {
  if (inline) {
    if (!id) return null;
    return (
      <Card className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto bg-surface-raised">
        <Body key={id} id={id} onClose={onClose} onChanged={onChanged} />
      </Card>
    );
  }
  return (
    <Drawer open={Boolean(id)} onClose={onClose}>
      {id && <Body key={id} id={id} onClose={onClose} onChanged={onChanged} />}
    </Drawer>
  );
}