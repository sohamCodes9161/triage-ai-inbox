import axios from "axios";

const http = axios.create({ baseURL: `${import.meta.env.VITE_API_URL || ""}/api` });

http.interceptors.request.use((cfg) => {
  const t = localStorage.getItem("triage-token");
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});
http.interceptors.response.use(
  (r) => r,
  (e) => {
    const url = e.config?.url || "";
    if (e.response?.status === 401 && !url.startsWith("/auth/")) {
      localStorage.removeItem("triage-token");
      if (location.pathname !== "/login") location.assign("/login");
    }
    return Promise.reject(e);
  }
);

export const errMsg = (e) => e?.response?.data?.error || (e?.code === "ERR_NETWORK" ? "Can't reach the server. Check that the API is running." : e?.message) || "Something went wrong";
const d = (p) => p.then((r) => r.data.data);

export const api = {
  get: (url, params) => d(http.get(url, { params })),
  post: (url, body) => d(http.post(url, body)),
  put: (url, body) => d(http.put(url, body)),
  patch: (url, body) => d(http.patch(url, body)),
  del: (url) => d(http.delete(url)),
};
