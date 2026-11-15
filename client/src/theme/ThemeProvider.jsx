import { createContext, useContext, useEffect, useState } from "react";

// Add a theme: 1) a [data-theme="id"] block in styles/themes.css  2) one entry here.
export const PRESETS = [
  { id: "executive-light", label: "Executive Light" },
  { id: "midnight-obsidian", label: "Midnight Obsidian" },
  { id: "editorial-warm", label: "Editorial Warm" },
];

const Ctx = createContext(null);
export const useTheme = () => useContext(Ctx);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || PRESETS[0].id);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem("triage-theme", theme); } catch { /* storage unavailable */ }
  }, [theme]);
  return <Ctx.Provider value={{ theme, setTheme, presets: PRESETS }}>{children}</Ctx.Provider>;
}
