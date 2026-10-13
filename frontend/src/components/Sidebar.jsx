import { useEffect, useRef, useState } from "react";
import { Headset, LayoutDashboard, Ticket, CirclePlus, ShieldCheck, Lock, ChevronsUpDown, LogOut } from "lucide-react";
import { initials, isStaff } from "../utils";

export default function Sidebar({ user, view, summary, onGo, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const footRef = useRef(null);
  const staff = isStaff(user);
  const admin = user.role === "admin";

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e) => {
      if (e.type === "keydown" ? e.key === "Escape" : !footRef.current?.contains(e.target))
        setMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [menuOpen]);

  const items = [
    ...(staff ? [{ key: "dashboard", label: "Dashboard", icon: LayoutDashboard }] : []),
    {
      key: "tickets",
      label: admin ? "All tickets" : staff ? "Tickets" : "My tickets",
      icon: Ticket,
      badge: summary?.active,
    },
    { key: "new", label: "New ticket", icon: CirclePlus },
  ];
  const current = view === "detail" ? "tickets" : view;

  return (
    <aside className="sidebar sidebar-3d" aria-label="Sidebar">
      <div className="brand brand-side-3d">
        <span className="brand-mark brand-mark-3d">
          <Headset size={19} aria-hidden="true" />
        </span>
        <div className="brand-text">
          <strong className="brand-title">HelpDesk</strong>
          <small className="brand-sub">AI Support Operations</small>
        </div>
      </div>

      <p className="side-label">Operations</p>
      <nav className="side-nav" aria-label="Main">
        {items.map(({ key, label, icon: Icon, badge }) => (
          <button
            key={key}
            className={current === key ? "nav-3d active" : "nav-3d"}
            aria-current={current === key ? "page" : undefined}
            onClick={() => onGo(key)}
          >
            <span className="nav-icon-wrap">
              <Icon size={17} aria-hidden="true" />
            </span>
            <span className="nav-label">{label}</span>
            {badge ? <span className="nav-badge-3d">{badge}</span> : null}
          </button>
        ))}
      </nav>

      <p className="side-label">Control Center</p>
      <nav className="side-nav" aria-label="Administration">
        <button
          className={current === "team" ? "nav-3d active" : "nav-3d"}
          aria-current={current === "team" ? "page" : undefined}
          onClick={() => onGo("team")}
        >
          <span className="nav-icon-wrap">
            <ShieldCheck size={17} aria-hidden="true" />
          </span>
          <span className="nav-label">Admin Portal</span>
          {!admin && <Lock size={13} className="nav-lock-3d" aria-label="Requires Admin Privileges" />}
        </button>
      </nav>

      <div className="side-foot side-foot-3d" ref={footRef}>
        {menuOpen && (
          <div className="menu menu-3d" role="menu">
            <button role="menuitem" onClick={onLogout} className="menu-logout-3d">
              <LogOut size={16} aria-hidden="true" />
              <span>Log out session</span>
            </button>
          </div>
        )}
        <button
          className="user-card user-card-3d"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span className="avatar avatar-3d" aria-hidden="true">
            {initials(user.name)}
          </span>
          <span className="user-text">
            <strong>{user.name}</strong>
            <small>{user.email}</small>
          </span>
          <ChevronsUpDown size={15} className="user-chevron" aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
}