import { useEffect, useMemo, useState } from "react";
import { Users as UsersIcon, Shield, Search, Check, AlertCircle } from "lucide-react";
import { api } from "../api";
import { ROLE_LABELS, initials, timeAgo } from "../utils";

const ROLES = ["employee", "agent", "admin"];

export default function Users({ user }) {
  const [users, setUsers] = useState(null);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    api.users().then(setUsers).catch((e) => setError(e.message));
  }, []);

  async function change(person, role) {
    setError("");
    setMessage("");
    setSavingId(person.id);
    try {
      const updated = await api.setRole(person.id, role);
      setUsers((list) => list.map((u) => (u.id === updated.id ? updated : u)));
      setMessage(`${updated.name} updated to: ${ROLE_LABELS[updated.role]}.`);
      setTimeout(() => setMessage(""), 3500);
    } catch (e) {
      setError(e.message);
    } finally {
      setSavingId(null);
    }
  }

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (users ?? []).filter((u) => !q || u.name.toLowerCase().includes(q) || u.email.includes(q));
  }, [users, query]);

  if (!users) {
    return error ? (
      <p className="error error-3d" role="alert">{error}</p>
    ) : (
      <div className="boot-pulse">
        <div className="pulse-loader" />
        <p className="muted">Loading user directory…</p>
      </div>
    );
  }

  const count = (role) => users.filter((u) => u.role === role).length;

  return (
    <>
      <header className="page-head page-head-3d">
        <div>
          <h1>Team & Role Governance</h1>
          <p className="sub">Directory of all registered members. Allocate access permissions and privileges.</p>
        </div>
      </header>

      <section className="panel-3d roles-note-3d">
        <div className="role-tier-badge">
          <strong>Employee ({count("employee")})</strong>
          <span>Submits issues and tracks personal tickets.</span>
        </div>
        <div className="role-tier-badge">
          <strong>Support Agent ({count("agent")})</strong>
          <span>Claims, updates, and resolves assigned and unassigned tickets.</span>
        </div>
        <div className="role-tier-badge">
          <strong>Administrator ({count("admin")})</strong>
          <span>Full operations visibility, team governance, and deletion controls.</span>
        </div>
      </section>

      <label className="field field-3d team-search">
        <span>Search Team Directory</span>
        <div className="input-wrap-3d search-input-3d">
          <Search size={15} className="search-icon-3d" aria-hidden="true" />
          <input
            type="search"
            placeholder="Search by name or email…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </label>

      {error && <p className="error error-3d" role="alert">{error}</p>}
      {message && (
        <div className="notice-success-3d" role="status">
          <Check size={16} />
          <span>{message}</span>
        </div>
      )}

      <ul className="team team-3d">
        {shown.map((u) => (
          <li key={u.id} className="team-row-3d">
            <span className="avatar-sm-3d" aria-hidden="true">
              {initials(u.name)}
            </span>
            <span className="team-who-3d">
              <strong>
                {u.name}
                {u.id === user.id && <span className="you-3d"> (you)</span>}
              </strong>
              <small>
                {u.email} · joined {timeAgo(u.created_at)}
              </small>
            </span>
            <div className="select-wrap-3d team-role-select">
              <select
                value={u.role}
                disabled={u.id === user.id || savingId === u.id}
                onChange={(e) => change(u, e.target.value)}
                aria-label={`Role for ${u.name}`}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
            </div>
          </li>
        ))}
        {shown.length === 0 && (
          <li className="empty-3d">
            <UsersIcon size={32} className="empty-icon-3d" />
            <p>No matching team members found.</p>
          </li>
        )}
      </ul>
    </>
  );
}