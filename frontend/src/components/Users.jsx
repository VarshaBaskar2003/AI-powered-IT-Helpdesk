import { useEffect, useMemo, useState } from "react";
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
    setError(""); setMessage(""); setSavingId(person.id);
    try {
      const updated = await api.setRole(person.id, role);
      setUsers((list) => list.map((u) => (u.id === updated.id ? updated : u)));
      setMessage(`${updated.name} is now: ${ROLE_LABELS[updated.role]}.`);
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

  if (!users) return error ? <p className="error" role="alert">{error}</p> : <p className="muted">Loading team…</p>;

  const count = (role) => users.filter((u) => u.role === role).length;

  return (
    <>
      <header className="page-head">
        <div>
          <h1>Admin panel</h1>
          <p className="sub">Your team: everyone who has signed up. Choose what each person can do.</p>
        </div>
      </header>

      <section className="panel roles-note">
        <p><b>Employee</b> ({count("employee")}): creates tickets and sees only their own.</p>
        <p><b>Support agent</b> ({count("agent")}): works on tickets assigned to them and can pick up unassigned ones.</p>
        <p><b>Admin</b> ({count("admin")}): sees every ticket, assigns work, deletes tickets and manages this page.</p>
      </section>

      <label className="field team-search">
        <span>Search people</span>
        <input type="search" placeholder="Name or email" value={query} onChange={(e) => setQuery(e.target.value)} />
      </label>

      {error && <p className="error" role="alert">{error}</p>}
      {message && <p className="ok" role="status">{message}</p>}

      <ul className="team">
        {shown.map((u) => (
          <li key={u.id} className="team-row">
            <span className="avatar-sm" aria-hidden="true">{initials(u.name)}</span>
            <span className="team-who">
              <strong>{u.name}{u.id === user.id && <span className="you"> (you)</span>}</strong>
              <small>{u.email} · joined {timeAgo(u.created_at)}</small>
            </span>
            <select value={u.role} disabled={u.id === user.id || savingId === u.id}
                    onChange={(e) => change(u, e.target.value)} aria-label={`Role for ${u.name}`}>
              {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </select>
          </li>
        ))}
        {shown.length === 0 && <li className="empty">No one matches that search.</li>}
      </ul>
    </>
  );
}