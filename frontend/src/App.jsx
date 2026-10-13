import { useEffect, useState } from "react";
import { api, getToken, onSessionExpired, setToken } from "./api";
import { isStaff, summarise } from "./utils";
import Login from "./components/Login";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Dashboard from "./components/Dashboard";
import TicketList from "./components/TicketList";
import TicketForm from "./components/TicketForm";
import TicketDetail from "./components/TicketDetail";
import Users from "./components/Users";
import AdminSignIn from "./components/AdminSignIn";

const MOBILE = "(max-width: 860px)";
const isMobile = () => window.matchMedia(MOBILE).matches;

function initialTheme() {
  try {
    const saved = localStorage.getItem("helpdesk_theme");
    if (saved === "dark" || saved === "light") return saved;
    localStorage.removeItem("theme");
  } catch { /* ignore */ }
  return "light";
}

export default function App() {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(Boolean(getToken())); // true while we check a saved login
  const [view, setView] = useState("tickets");
  const [ticketId, setTicketId] = useState(null);
  const [meta, setMeta] = useState(null);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");
  const [navOpen, setNavOpen] = useState(() => !isMobile());
  const [theme, setTheme] = useState(initialTheme);

  const homeFor = (u) => (isStaff(u) ? "dashboard" : "tickets");

  // Keep the sidebar sensible when the screen size changes (rotating a phone, resizing a window).
  useEffect(() => {
    const mq = window.matchMedia(MOBILE);
    const sync = (e) => setNavOpen(!e.matches);
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Apply the theme to the whole page.
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem("helpdesk_theme", theme); } catch { /* ignore */ }
  }, [theme]);

  // On first load: if a token is saved, ask the server who we are.
  useEffect(() => {
    onSessionExpired(() => setUser(null));
    if (!getToken()) return;
    api.me()
      .then((u) => { setUser(u); setView(homeFor(u)); })
      .catch(() => setToken(null))
      .finally(() => setBooting(false));
  }, []);

  // After login: load the dropdown options.
  useEffect(() => {
    if (!user) return;
    api.meta().then(setMeta).catch((e) => setError(e.message));
  }, [user]);

  // Numbers for the sidebar badge and the bell. Refresh whenever the page changes.
  useEffect(() => {
    if (!user) return;
    api.listTickets().then((list) => setSummary(summarise(list))).catch(() => {});
  }, [user, view, ticketId]);

  const go = (next) => { setView(next); if (isMobile()) setNavOpen(false); };
  const open = (id) => { setTicketId(id); setView("detail"); };

  // `next` lets the admin sign-in land on the Admin panel instead of the usual home page.
  function handleLogin(u, next) {
    setUser(u);
    setView(next ?? homeFor(u));
    setTicketId(null);
    setError("");
    setBooting(false);
  }

  function logout() {
    setToken(null);
    setUser(null);
    setMeta(null);
    setSummary(null);
  }

  if (booting) {
    return (
      <div className="login-wrap-3d">
        <div className="boot-pulse">
          <div className="pulse-loader" />
          <p className="muted">Connecting to secure HelpDesk cluster…</p>
        </div>
      </div>
    );
  }
  if (!user) return <Login onLogin={handleLogin} />;

  const staff = isStaff(user);
  const admin = user.role === "admin";
  let page = view;
  if (view === "dashboard" && !staff) page = "tickets";   // employees never see the dashboard
  // "team" is the Admin panel. Admins see it; everyone else sees the admin sign-in there.
  const titles = {
    dashboard: "Dashboard", tickets: admin ? "All tickets" : staff ? "Tickets" : "My tickets",
    new: "New ticket", detail: "Ticket", team: "Admin panel",
  };

  let content;
  if (error) content = <p className="error error-3d" role="alert">{error}</p>;
  else if (!meta) content = (
    <div className="boot-pulse">
      <div className="pulse-loader" />
      <p className="muted">Synchronizing workspace metadata…</p>
    </div>
  );
  else if (page === "dashboard") content = <Dashboard user={user} onOpen={open} />;
  else if (page === "tickets") content = <TicketList user={user} meta={meta} onOpen={open} onNew={() => setView("new")} />;
  else if (page === "new") content = <TicketForm meta={meta} onCreated={open} onCancel={() => setView("tickets")} />;
  else if (page === "team" && admin) content = <Users user={user} />;
  else if (page === "team") content = <AdminSignIn user={user} onSuccess={(u) => handleLogin(u, "team")} onCancel={() => setView(homeFor(user))} />;
  else content = <TicketDetail key={ticketId} id={ticketId} user={user} meta={meta} onBack={() => setView("tickets")} />;

  return (
    <div className={navOpen ? "app nav-open" : "app"}>
      <Sidebar user={user} view={page} summary={summary} onGo={go} onLogout={logout} />
      <div className="scrim" onClick={() => setNavOpen(false)} aria-hidden="true" />
      <div className="content">
        <Topbar title={titles[page]} user={user} summary={summary} theme={theme}
                onToggleNav={() => setNavOpen((o) => !o)}
                onToggleTheme={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
                onSearch={() => go("tickets")} onGo={go} />
        <main>{content}</main>
      </div>
    </div>
  );
}