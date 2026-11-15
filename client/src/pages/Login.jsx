import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ArrowRight, Eye, ShieldCheck, Zap } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { errMsg } from "../api/client.js";
import { Button, cx, inputCls } from "../components/ui.jsx";
import { Logo } from "../components/Layout.jsx";
import ThemeSwitcher from "../theme/ThemeSwitcher.jsx";

export default function Login() {
  const { user, login, signup, demo } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState("login");
  const [f, setF] = useState({ name: "", email: "", password: "" });
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  if (user) return <Navigate to="/" replace />;

  const go = async (key, fn) => {
    setBusy(key); setError("");
    try { await fn(); nav("/"); } catch (e) { setError(errMsg(e)); } finally { setBusy(""); }
  };
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <section className="hidden flex-col justify-between bg-accent p-12 text-on-accent lg:flex">
        <span className="font-display text-xl">Triage</span>
        <div className="max-w-md">
          <h1 className="text-4xl leading-tight">Know who needs to reply before you open the email.</h1>
          <p className="mt-4 text-base opacity-90">Triage reads every client email, decides whether you, your client, or nobody should respond, and gives each of you a view built for the job.</p>
          <ul className="mt-8 space-y-3 text-sm opacity-95">
            <li className="flex items-center gap-3"><Zap className="h-4 w-4" /> Every email labelled with a reason and confidence</li>
            <li className="flex items-center gap-3"><Eye className="h-4 w-4" /> A quiet client view with only what needs them</li>
            <li className="flex items-center gap-3"><ShieldCheck className="h-4 w-4" /> AI drafts are always reviewed before sending</li>
          </ul>
        </div>
        <p className="text-xs opacity-75">Prototype · email accounts and sync are simulated</p>
      </section>

      <section className="flex flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between lg:justify-end"><span className="lg:hidden"><Logo /></span><ThemeSwitcher /></div>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-8">
          <h2 className="text-2xl">{mode === "login" ? "Sign in" : "Create your assistant account"}</h2>
          <p className="mt-1 text-sm text-secondary">{mode === "login" ? "Assistants and clients sign in here." : "Clients are added from inside the app."}</p>

          <form className="mt-6 space-y-3" onSubmit={(e) => { e.preventDefault(); go("form", () => (mode === "login" ? login(f.email, f.password) : signup(f.name, f.email, f.password))); }}>
            {mode === "signup" && <div><label className="mb-1 block text-sm text-secondary" htmlFor="name">Full name</label><input id="name" required minLength={2} value={f.name} onChange={set("name")} className={inputCls} /></div>}
            <div><label className="mb-1 block text-sm text-secondary" htmlFor="email">Email</label><input id="email" type="email" required value={f.email} onChange={set("email")} className={inputCls} autoComplete="email" /></div>
            <div><label className="mb-1 block text-sm text-secondary" htmlFor="pw">Password</label><input id="pw" type="password" required minLength={mode === "signup" ? 6 : 1} value={f.password} onChange={set("password")} className={inputCls} autoComplete={mode === "login" ? "current-password" : "new-password"} /></div>
            {error && <p role="alert" className="rounded-control bg-status-client-soft px-3 py-2 text-sm text-status-client">{error}</p>}
            <Button type="submit" variant="primary" className="w-full" loading={busy === "form"}>{mode === "login" ? "Sign in" : "Create account"}</Button>
          </form>
          <button className="mt-3 text-sm text-accent hover:underline" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}>
            {mode === "login" ? "New here? Create an assistant account" : "Already have an account? Sign in"}
          </button>

          <div className="my-6 flex items-center gap-3 text-xs text-subtle"><span className="h-px flex-1 bg-line" />or try the demo<span className="h-px flex-1 bg-line" /></div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button onClick={() => go("a", () => demo("assistant"))} loading={busy === "a"}>Enter as assistant <ArrowRight className="h-4 w-4" /></Button>
            <Button onClick={() => go("c", () => demo("client"))} loading={busy === "c"}>Enter as client <ArrowRight className="h-4 w-4" /></Button>
          </div>
          <p className="mt-4 rounded-control bg-muted px-3 py-2 text-xs text-secondary">
            Demo logins: <span className="text-primary">demo.assistant@triage.app</span> or <span className="text-primary">demo.client@triage.app</span>, password <span className="text-primary">demo1234</span>
          </p>
        </div>
      </section>
    </div>
  );
}
