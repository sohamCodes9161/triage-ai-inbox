import React from "react";
import ReactDOM from "react-dom/client";
import "./styles/themes.css";
import "./styles/index.css";
import App from "./App.jsx";
import { ThemeProvider } from "./theme/ThemeProvider.jsx";
import { ToastProvider } from "./components/ui.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  </React.StrictMode>
);
