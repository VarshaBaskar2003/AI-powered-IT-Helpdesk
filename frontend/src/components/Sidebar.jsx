import { useEffect, useRef, useState } from "react";
import { Headset, LayoutDashboard, Ticket, CirclePlus, ShieldCheck, Lock, ChevronsUpDown, LogOut } from "lucide-react";
import { initials, isStaff } from "../utils";

export default function Sidebar({ user, view, summary, onGo, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const footRef = useRef(null);
  const staff = isStaff(user);
  const admin = user.role === "admin";

  // Close the little user menu when you click anywhere else or press Escape.
  useEffect(() => {
    if (!menuOpen) return;
    const close = (e) => { if (e.type === "keydown" ? e.key === "Escape" : !footRef.current?.contains(e.target)) setMenuOpen(false); };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", close); };
  }, [menuOpen]);

  const items = [
    ...(staff ? [{ key: "dashboard", label: "Dashboard", icon: LayoutDashboard }] : []),
    { key: "tickets", label: admin ? "All tickets" : staff ? "Tickets" : "My tickets", icon: Ticket, badge: summary?.active },
    { key: "new", label: "New ticket", icon: CirclePlus },
  ];
  const current = view === "detail" ? "tickets" : view;   // a ticket page belongs under "Tickets"

  return (
    <aside className="sidebar" aria-label="Sidebar">
      <div className="brand">
        <span className="brand-mark"><Headset size={18} aria-hidden="true" /></span>
        <div><strong>HelpDesk</strong><small>Support Platform</small></div>
      </div>

      <p className="side-label">Navigation</p>
      <nav className="side-nav" aria-label="Main">
        {items.map(({ key, label, icon: Icon, badge }) => (
          <button key={key} className={current === key ? "nav active" : "nav"}
                  aria-current={current === key ? "page" : undefined} onClick={() => onGo(key)}>
            <Icon size={17} aria-hidden="true" />
            <span>{label}</span>
            {badge ? <span className="nav-badge">{badge}</span> : null}
          </button>
        ))}
      </nav>

      {/* Everyone sees this link. Admins go straight in; everyone else gets an admin sign-in. */}
      <p className="side-label">Administration</p>
      <nav className="side-nav" aria-label="Administration">
        <button className={current === "team" ? "nav active" : "nav"}
                aria-current={current === "team" ? "page" : undefined} onClick={() => onGo("team")}>
          <ShieldCheck size={17} aria-hidden="true" />
          <span>Admin panel</span>
          {!admin && <Lock size={14} className="nav-lock" aria-label="Needs an admin sign-in" />}
        </button>
      </nav>

      <div className="side-foot" ref={footRef}>
        {menuOpen && (
          <div className="menu" role="menu">
            <button role="menuitem" onClick={onLogout}><LogOut size={16} aria-hidden="true" />Log out</button>
          </div>
        )}
        <button className="user-card" aria-haspopup="menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((o) => !o)}>
          <span className="avatar" aria-hidden="true">{initials(user.name)}</span>
          <span className="user-text"><strong>{user.name}</strong><small>{user.email}</small></span>
          <ChevronsUpDown size={16} aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
}