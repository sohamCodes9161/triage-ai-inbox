import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Inbox, Loader2, X, XCircle } from "lucide-react";

export const cx = (...a) => a.filter(Boolean).join(" ");

const VARIANTS = {
  primary: "bg-accent text-on-accent hover:bg-accent-hover",
  secondary: "bg-surface text-primary border border-line-strong hover:bg-muted",
  ghost: "text-secondary hover:bg-muted",
  danger: "bg-status-client-soft text-status-client hover:opacity-80",
  success: "bg-status-success-soft text-status-success hover:opacity-80",
};

export function Button({ variant = "secondary", size = "md", loading, className, children, ...p }) {
  return (
    <button {...p} disabled={p.disabled || loading}
      className={cx("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-control font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
        size === "sm" ? "px-2.5 py-1.5 text-xs" : "px-3.5 py-2 text-sm", VARIANTS[variant], className)}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

export const Card = ({ className, ...p }) => <div {...p} className={cx("rounded-card border border-line bg-surface shadow-card", className)} />;

export const inputCls = "w-full rounded-control border border-line-strong bg-surface px-3 py-2 text-sm text-primary placeholder:text-subtle";

export const Spinner = ({ className }) => <Loader2 className={cx("h-5 w-5 animate-spin text-accent", className)} />;
export const Skeleton = ({ className }) => <div className={cx("animate-pulse rounded-control bg-muted", className)} />;

export function EmptyState({ icon: Icon = Inbox, title, text, action }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-pill bg-muted text-subtle"><Icon className="h-5 w-5" /></span>
      <p className="font-display text-base text-primary">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm text-secondary">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-pill bg-status-client-soft text-status-client"><AlertTriangle className="h-5 w-5" /></span>
      <p className="font-display text-base text-primary">Couldn't load this</p>
      <p className="mt-1 max-w-sm text-sm text-secondary">{message}</p>
      {onRetry && <Button className="mt-4" onClick={onRetry}>Try again</Button>}
    </div>
  );
}

export function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return;
    const h = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-overlay/50" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-t-card bg-surface-raised p-card shadow-pop sm:rounded-card">{children}</div>
    </div>
  );
}

export function Drawer({ open, onClose, children }) {
  useEffect(() => {
    if (!open) return;
    const h = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-overlay/40" onClick={onClose} />
      <aside className="drawer-in relative h-full w-full overflow-y-auto bg-surface-raised shadow-pop md:max-w-xl">{children}</aside>
    </div>
  );
}

const ToastCtx = createContext(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const push = useCallback((message, type = "success") => {
    const id = Math.random();
    setItems((s) => [...s, { id, message, type }]);
    setTimeout(() => setItems((s) => s.filter((t) => t.id !== id)), 4200);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className="pointer-events-auto flex max-w-md items-center gap-2 rounded-control border border-line bg-surface-raised px-3.5 py-2.5 text-sm text-primary shadow-pop">
            {t.type === "error" ? <XCircle className="h-4 w-4 shrink-0 text-status-client" /> : <CheckCircle2 className="h-4 w-4 shrink-0 text-status-success" />}
            <span>{t.message}</span>
            <button onClick={() => setItems((s) => s.filter((x) => x.id !== t.id))} className="text-subtle" aria-label="Dismiss"><X className="h-3.5 w-3.5" /></button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export const Avatar = ({ name = "", className }) => (
  <span className={cx("inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-pill bg-accent-soft text-xs font-medium text-accent", className)}>
    {name.split(" ").map((x) => x[0]).slice(0, 2).join("").toUpperCase()}
  </span>
);
