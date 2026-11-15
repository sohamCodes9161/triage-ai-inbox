import { useEffect, useRef, useState } from "react";
import { Palette, Check } from "lucide-react";
import { useTheme } from "./ThemeProvider.jsx";

// Swatches re-scope the CSS variables with data-theme, so no colors are hardcoded here.
function Swatch({ id }) {
  return (
    <span data-theme={id} className="flex h-6 w-9 items-center justify-center gap-0.5 rounded-control border border-line-strong" style={{ background: "rgb(var(--bg-canvas))" }}>
      <span className="h-3 w-3 rounded-pill" style={{ background: "rgb(var(--accent))" }} />
      <span className="h-3 w-2 rounded-pill" style={{ background: "rgb(var(--bg-surface))", border: "1px solid rgb(var(--border-strong))" }} />
    </span>
  );
}

export default function ThemeSwitcher() {
  const { theme, setTheme, presets } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} aria-label="Change theme" aria-expanded={open}
        className="inline-flex items-center gap-2 rounded-control border border-line-strong bg-surface px-2.5 py-1.5 text-sm text-secondary hover:bg-muted">
        <Palette className="h-4 w-4" /> <span className="hidden sm:inline">Theme</span>
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-60 rounded-card border border-line bg-surface-raised p-1.5 shadow-pop">
          {presets.map((p) => (
            <button key={p.id} onClick={() => { setTheme(p.id); setOpen(false); }}
              className="flex w-full items-center gap-3 rounded-control px-2 py-2 text-left text-sm text-primary hover:bg-muted">
              <Swatch id={p.id} />
              <span className="flex-1">{p.label}</span>
              {theme === p.id && <Check className="h-4 w-4 text-accent" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
