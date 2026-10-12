// All communication with the backend lives here, so components stay simple.
const BASE = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");

// ---- login token (the "wristband" the server gives us after sign in) ----
let token = null;
try { token = localStorage.getItem("token"); } catch { /* storage blocked */ }
let onSignedOut = () => {};

export const getToken = () => token;
export function setToken(value) {
  token = value;
  try { value ? localStorage.setItem("token", value) : localStorage.removeItem("token"); } catch { /* ignore */ }
}
// App.jsx registers a function here; we call it when the server says "you are not signed in".
export const onSessionExpired = (fn) => { onSignedOut = fn; };

async function request(path, options = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(BASE + path, { ...options, headers });
  } catch {
    throw new Error("Cannot reach the server. Check that the backend is running.");
  }
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (typeof body.detail === "string") message = body.detail;
      else if (Array.isArray(body.detail))
        message = body.detail.map((d) => `${d.loc.slice(1).join(".")}: ${d.msg}`).join("; ");
    } catch { /* keep default message */ }
    // Expired or invalid token: sign out. (A wrong password on the login form is NOT this case.)
    if (res.status === 401 && path !== "/api/auth/login") {
      setToken(null);
      onSignedOut();
    }
    throw new Error(message);
  }
  return res.status === 204 ? null : res.json();
}

const send = (method, body) => ({ method, body: JSON.stringify(body) });

export const api = {
  login: (data) => request("/api/auth/login", send("POST", data)),
  register: (data) => request("/api/auth/register", send("POST", data)),
  me: () => request("/api/auth/me"),
  users: () => request("/api/users"),
  setRole: (id, role) => request(`/api/users/${id}/role`, send("PUT", { role })),
  demoAdmin: () => request("/api/demo-admin"),
  meta: () => request("/api/meta"),
  stats: () => request("/api/stats"),
  listTickets: (filters = {}) => {
    const params = new URLSearchParams(Object.entries(filters).filter(([, v]) => v));
    return request(`/api/tickets?${params}`);
  },
  getTicket: (id) => request(`/api/tickets/${id}`),
  createTicket: (data) => request("/api/tickets", send("POST", data)),
  updateTicket: (id, data) => request(`/api/tickets/${id}`, send("PUT", data)),
  deleteTicket: (id) => request(`/api/tickets/${id}`, { method: "DELETE" }),
  analyze: (data) => request("/api/ai/analyze", send("POST", data)),
  draftReply: (id) => request(`/api/tickets/${id}/draft-reply`, { method: "POST" }),
};