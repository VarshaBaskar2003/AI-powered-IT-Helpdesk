import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { api } from "../api";
import { isStaff, ticketCode, timeAgo } from "../utils";
import { PriorityBadge, StatusBadge } from "./Badges";

const EMPTY = { search: "", status: "", priority: "", category: "", assigned_to: "" };

function Select({ label, value, onChange, options }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">All</option>
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
    </label>
  );
}

export default function TicketList({ user, meta, onOpen, onNew }) {
  const staff = isStaff(user);
  const admin = user.role === "admin";
  const [filters, setFilters] = useState(EMPTY);
  const [search, setSearch] = useState("");      // debounced copy of filters.search
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const set = (key) => (value) => setFilters((f) => ({ ...f, [key]: value }));

  // Wait 300 ms after typing stops before calling the API.
  useEffect(() => {
    const t = setTimeout(() => setSearch(filters.search), 300);
    return () => clearTimeout(t);
  }, [filters.search]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.listTickets({ ...filters, search })
      .then((d) => { if (!cancelled) { setTickets(d); setError(""); } })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filters.status, filters.priority, filters.category, filters.assigned_to]);

  const filtered = Object.values(filters).some(Boolean);

  return (
    <>
      <header className="page-head">
        <div>
          <h1>{admin ? "All tickets" : staff ? "Tickets" : "My tickets"}</h1>
          <p className="sub">
            {admin ? "Search, filter and manage every ticket."
              : staff ? "Tickets assigned to you, plus unassigned ones you can pick up."
              : "Tickets you have reported."}
          </p>
        </div>
        <button className="btn primary" onClick={onNew}><Plus size={16} aria-hidden="true" />New ticket</button>
      </header>

      <section className="filters" aria-label="Search and filters">
        <label className="field grow">
          <span>Search</span>
          <input type="search" placeholder="Title, name or ticket number"
                 value={filters.search} onChange={(e) => set("search")(e.target.value)} />
        </label>
        <Select label="Status" value={filters.status} onChange={set("status")} options={meta.statuses} />
        <Select label="Priority" value={filters.priority} onChange={set("priority")} options={meta.priorities} />
        <Select label="Category" value={filters.category} onChange={set("category")} options={meta.categories} />
        {staff && <Select label="Assigned to" value={filters.assigned_to} onChange={set("assigned_to")} options={["Unassigned", ...(admin ? meta.staff : [user.name])]} />}
        {filtered && <button className="btn" onClick={() => { setFilters(EMPTY); setSearch(""); }}>Clear filters</button>}
      </section>

      {error && <p className="error" role="alert">{error}</p>}
      {loading && !tickets.length && <p className="muted">Loading tickets…</p>}

      {!loading && !error && tickets.length === 0 && (
        <p className="empty">
          {filtered ? "No tickets match these filters. Try clearing one." : "No tickets yet. Create the first one."}
        </p>
      )}

      <ul className="tickets">
        {tickets.map((t) => (
          <li key={t.id}>
            <button className="ticket" onClick={() => onOpen(t.id)}>
              <span className="t-main">
                <span className="t-title"><span className="t-id">{ticketCode(t.id)}</span> {t.title}</span>
                <span className="t-meta">{t.requester_name} · {t.category} · {timeAgo(t.created_at)}</span>
              </span>
              <span className="t-badges">
                <PriorityBadge value={t.priority} />
                <StatusBadge value={t.status} />
              </span>
              <span className={`t-agent ${t.assigned_to ? "" : "none"}`}>{t.assigned_to || "Unassigned"}</span>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}