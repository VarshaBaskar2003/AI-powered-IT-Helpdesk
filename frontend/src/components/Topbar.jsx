import { useEffect, useRef, useState } from "react";
import { PanelLeft, Search, Bell, Sun, Moon, ShieldAlert, ChevronRight, Activity, Command } from "lucide-react";
import { ROLE_LABELS, isStaff } from "../utils";

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

export default function Topbar({ title, user, summary, theme, onToggleNav, onToggleTheme, onSearch, onGo }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const staff = isStaff(user);

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (e.type === "keydown" ? e.key === "Escape" : !wrapRef.current?.contains(e.target))
        setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  // Keyboard shortcut listener for Ctrl+K / Cmd+K search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onSearch();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onSearch]);

  // What the bell alerts about
  const alerts = [];
  if (summary && staff) {
    if (summary.overdue) alerts.push(`${plural(summary.overdue, "ticket")} past SLA deadline`);
    if (summary.unassigned) alerts.push(`${plural(summary.unassigned, "ticket")} awaiting owner`);
    if (summary.urgent) alerts.push(`${plural(summary.urgent, "urgent ticket")} (High / Critical)`);
  } else if (summary?.active) {
    alerts.push(`${plural(summary.active, "open ticket")} in your tracking queue`);
  }
  const needsAttention = staff && alerts.length > 0;

  return (
    <header className="topbar-modern">
      <div className="topbar-left">
        <button
          className="topbar-btn topbar-btn-toggle"
          onClick={onToggleNav}
          aria-label="Toggle Navigation Sidebar"
          title="Toggle Sidebar"
        >
          <PanelLeft size={18} aria-hidden="true" />
        </button>

        <div className="topbar-breadcrumb">
          <span className="breadcrumb-root">HelpDesk</span>
          <ChevronRight size={14} className="breadcrumb-sep" aria-hidden="true" />
          <h1 className="breadcrumb-current">{title}</h1>
        </div>
      </div>

      <div className="topbar-right">
        {/* Quick Search Trigger Pill */}
        <button
          className="topbar-search-pill"
          onClick={onSearch}
          aria-label="Quick search tickets"
          title="Search tickets (Ctrl+K)"
        >
          <Search size={15} className="search-pill-icon" aria-hidden="true" />
          <span className="search-pill-text">Quick search…</span>
          <kbd className="search-shortcut">
            <Command size={10} aria-hidden="true" />K
          </kbd>
        </button>

        {/* User Role Badge */}
        <span className={`topbar-role-badge role-${user.role}`}>
          <span className="role-status-dot" />
          <span>{ROLE_LABELS[user.role]}</span>
        </span>

        {/* Notification Bell */}
        <div className="pop-wrap" ref={wrapRef}>
          <button
            className={`topbar-btn ${needsAttention ? "has-alert" : ""}`}
            onClick={() => setOpen((o) => !o)}
            aria-haspopup="true"
            aria-expanded={open}
            aria-label={needsAttention ? "Notifications, action required" : "Notifications"}
            title="Notifications"
          >
            <Bell size={18} aria-hidden="true" />
            {needsAttention && (
              <span className="topbar-alert-dot pulse-red" aria-hidden="true" />
            )}
          </button>

          {open && (
            <div className="popover popover-modern">
              <div className="popover-head">
                <strong>{staff ? "Operational Alerts" : "Your Tickets"}</strong>
                {needsAttention && (
                  <span className="popover-badge-count">
                    <ShieldAlert size={12} /> {alerts.length}
                  </span>
                )}
              </div>
              {alerts.length === 0 ? (
                <p className="muted popover-empty">All queues are healthy and caught up.</p>
              ) : (
                <div className="popover-list">
                  {alerts.map((text) => (
                    <button
                      key={text}
                      className="popover-item"
                      onClick={() => {
                        setOpen(false);
                        onGo("tickets");
                      }}
                    >
                      <span className="popover-bullet" />
                      <span>{text}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Theme Toggle Button */}
        <button
          className="topbar-btn topbar-theme-toggle"
          onClick={onToggleTheme}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? (
            <Sun size={18} className="theme-icon sun-glow" aria-hidden="true" />
          ) : (
            <Moon size={18} className="theme-icon moon-glow" aria-hidden="true" />
          )}
        </button>
      </div>
    </header>
  );
}