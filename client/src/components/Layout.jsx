import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { LogOut, Plug, Sparkles } from "lucide-react";
import ThemeSwitcher from "../theme/ThemeSwitcher.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { cx } from "./ui.jsx";

export const Logo = () => (
  <span className="flex items-center gap-2.5">
    <span className="flex h-8 w-8 items-center justify-center rounded-control bg-accent text-on-accent shadow-card">
      <Sparkles className="h-4 w-4" />
    </span>
    <span className="font-display text-lg font-heading tracking-display text-primary">Triage</span>
  </span>
);

const seg = ({ isActive }) =>
  cx(
    "flex-1 sm:flex-initial text-center rounded-control px-3 py-1.5 text-sm font-medium transition-all",
    isActive ? "bg-surface text-primary shadow-card" : "text-secondary hover:text-primary"
  );

export default function Layout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const isAssistant = user.role === "assistant";

  return (
    <div className="min-h-screen bg-canvas text-primary">
      <header className="sticky top-0 z-30 border-b border-line bg-canvas/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-4">
              <Link to="/" aria-label="Triage home">
                <Logo />
              </Link>
              {isAssistant && (
                <nav className="hidden rounded-control bg-muted p-0.5 sm:flex" aria-label="View mode">
                  <NavLink to="/" end className={seg}>Assistant</NavLink>
                  <NavLink to="/client-preview" className={seg}>Client view</NavLink>
                </nav>
              )}
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              {isAssistant && (
                <Link
                  to="/connect"
                  className="inline-flex items-center gap-2 rounded-control border border-line-strong bg-surface px-2.5 py-1.5 text-sm text-secondary transition-colors hover:bg-muted hover:text-primary"
                  aria-label="Connections"
                >
                  <Plug className="h-4 w-4" />
                  <span className="hidden md:inline">Connections</span>
                </Link>
              )}
              <ThemeSwitcher />
              <button
                onClick={() => {
                  logout();
                  nav("/login");
                }}
                className="inline-flex items-center gap-2 rounded-control px-2.5 py-1.5 text-sm text-secondary transition-colors hover:bg-muted hover:text-primary"
                aria-label="Sign out"
                title="Sign out"
              >
                <span className="hidden max-w-[8rem] truncate lg:inline">{user.name}</span>
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>

          {isAssistant && (
            <nav className="mt-2.5 flex rounded-control bg-muted p-0.5 sm:hidden" aria-label="Mobile view mode">
              <NavLink to="/" end className={seg}>Assistant</NavLink>
              <NavLink to="/client-preview" className={seg}>Client view</NavLink>
            </nav>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-5 sm:py-6">
        <Outlet />
      </main>
    </div>
  );
}