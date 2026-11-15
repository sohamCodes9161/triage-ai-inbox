import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api/client.js";

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem("triage-token")));

  useEffect(() => {
    if (!localStorage.getItem("triage-token")) return;
    api.get("/auth/me").then(setUser).catch(() => localStorage.removeItem("triage-token")).finally(() => setLoading(false));
  }, []);

  const start = ({ token, user }) => { localStorage.setItem("triage-token", token); setUser(user); return user; };
  const value = {
    user, loading,
    login: (email, password) => api.post("/auth/login", { email, password }).then(start),
    signup: (name, email, password) => api.post("/auth/signup", { name, email, password }).then(start),
    demo: (role) => api.post("/auth/demo", { role }).then(start),
    logout: () => { localStorage.removeItem("triage-token"); setUser(null); },
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
