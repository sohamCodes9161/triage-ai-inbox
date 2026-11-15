import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import Layout from "./components/Layout.jsx";
import { Spinner } from "./components/ui.jsx";
import Login from "./pages/Login.jsx";
import Connect from "./pages/Connect.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import ClientView from "./pages/ClientView.jsx";
import { api } from "./api/client.js";
import { useFetch } from "./lib/hooks.js";

const Loading = () => <div className="flex min-h-[50vh] items-center justify-center"><Spinner className="h-6 w-6" /></div>;

function Protected() {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  return user ? <Layout /> : <Navigate to="/login" replace />;
}

function Guard({ role, children }) {
  const { user } = useAuth();
  return user.role === role ? children : <Navigate to="/" replace />;
}

// Assistants without a connected mailbox are sent to onboarding first.
function AssistantHome() {
  const { data, loading } = useFetch(() => api.get("/connections"), []);
  if (loading) return <Loading />;
  return data?.some((c) => c.status === "connected") ? <Dashboard /> : <Navigate to="/connect" replace />;
}

function Home() {
  const { user } = useAuth();
  return user.role === "client" ? <ClientView /> : <AssistantHome />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<Protected />}>
          <Route path="/" element={<Home />} />
          <Route path="/connect" element={<Guard role="assistant"><Connect /></Guard>} />
          <Route path="/client-preview" element={<Guard role="assistant"><ClientView preview /></Guard>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
