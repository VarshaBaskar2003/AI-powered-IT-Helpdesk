import { useEffect, useRef, useState } from "react";
import { PanelLeft, Search, Bell, Sun, Moon } from "lucide-react";
import { ROLE_LABELS, isStaff } from "../utils";

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

export default function Topbar({ title, user, summary, theme, onToggleNav, onToggleTheme, onSearch, onGo }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const staff = isStaff(user);

  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (e.type === "keydown" ? e.key === "Escape" : !wrapRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", close); };
  }, [open]);

  // What the bell tells you about.
  const alerts = [];
  if (summary && staff) {
    if (summary.overdue) alerts.push(`${plural(summary.overdue, "ticket")} past the target time`);
    if (summary.unassigned) alerts.push(`${plural(summary.unassigned, "ticket")} with no owner`);
    if (summary.urgent) alerts.push(`${plural(summary.urgent, "urgent ticket")} (High or Critical)`);
  } else if (summary?.active) {
    alerts.push(`${plural(summary.active, "ticket")} of yours still open`);
  }
  const needsAttention = staff && alerts.length > 0;

  return (
    <header className="topbar">
      <div className="top-left">
        <button className="icon-btn" onClick={onToggleNav} aria-label="Show or hide the sidebar">
          <PanelLeft size={18} aria-hidden="true" />
        </button>
        <span className="top-divider" aria-hidden="true" />
        <span className="top-title">{title}</span>
      </div>

      <div className="top-right">
        <span className="role-pill">{ROLE_LABELS[user.role]}</span>
        <button className="icon-btn" onClick={onSearch} aria-label="Search tickets" title="Search tickets">
          <Search size={18} aria-hidden="true" />
        </button>

        <div className="pop-wrap" ref={wrapRef}>
          <button className="icon-btn" onClick={() => setOpen((o) => !o)} aria-haspopup="true" aria-expanded={open}
                  aria-label={needsAttention ? "Notifications, something needs attention" : "Notifications"}>
            <Bell size={18} aria-hidden="true" />
            {needsAttention && <span className="dot" aria-hidden="true" />}
          </button>
          {open && (
            <div className="popover">
              <strong>{staff ? "Needs attention" : "Your tickets"}</strong>
              {alerts.length === 0 && <p className="muted">You are all caught up.</p>}
              {alerts.map((text) => (
                <button key={text} className="pop-item" onClick={() => { setOpen(false); onGo("tickets"); }}>{text}</button>
              ))}
            </div>
          )}
        </div>

        <button className="icon-btn" onClick={onToggleTheme}
                aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
          {theme === "dark" ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
        </button>
      </div>
    </header>
  );
}