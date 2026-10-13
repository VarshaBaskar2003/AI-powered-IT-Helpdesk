import { useEffect, useState } from "react";
import { Plus, Search, FilterX, Ticket as TicketIcon } from "lucide-react";
import { api } from "../api";
import { isStaff, ticketCode, timeAgo } from "../utils";
import { PriorityBadge, StatusBadge } from "./Badges";

const EMPTY = { search: "", status: "", priority: "", category: "", assigned_to: "" };

// Opened dropdown list: black text on white
const OPTION_STYLE = { color: "#605d5dff", backgroundColor: "#ffffff" };

// Closed select box: grey text once a value has been chosen
const SELECTED_TEXT_COLOR = "#9ca3af";

function Select({ label, value, onChange, options }) {
  return (
    <label className="field field-3d">
      <span>{label}</span>
      <div className="select-wrap-3d">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={value ? { color: SELECTED_TEXT_COLOR } : undefined}
        >
          <option value="" style={OPTION_STYLE}>All</option>
          {options.map((o) => (
            <option key={o} value={o} style={OPTION_STYLE}>
              {o}
            </option>
          ))}
        </select>
      </div>
    </label>
  );
}

export default function TicketList({ user, meta, onOpen, onNew }) {
  const staff = isStaff(user);
  const admin = user.role === "admin";
  const [filters, setFilters] = useState(EMPTY);
  const [search, setSearch] = useState(""); // debounced copy of filters.search
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
    api
      .listTickets({ ...filters, search })
      .then((d) => {
        if (!cancelled) {
          setTickets(d);
          setError("");
        }
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filters.status, filters.priority, filters.category, filters.assigned_to]);

  const filtered = Object.values(filters).some(Boolean);

  return (
    <>
      <header className="page-head page-head-3d">
        <div>
          <h1>{admin ? "All Tickets" : staff ? "Tickets Queue" : "My Tickets"}</h1>
          <p className="sub">
            {admin
              ? "Comprehensive multi-tier service registry with live filtering."
              : staff
                ? "Assigned incident tickets and open unassigned requests."
                : "Tickets and incident requests submitted by your account."}
          </p>
        </div>
        <button className="btn-3d primary-3d" onClick={onNew}>
          <Plus size={16} aria-hidden="true" />
          <span>New Ticket</span>
        </button>
      </header>

      <section className="filters filters-3d" aria-label="Search and filters">
        <label className="field field-3d grow">
          <span>Search Tickets</span>
          <div className="input-wrap-3d search-input-3d">
            <Search size={15} className="search-icon-3d" aria-hidden="true" />
            <input
              type="search"
              placeholder="Filter by title, requester, or ticket ID…"
              value={filters.search}
              onChange={(e) => set("search")(e.target.value)}
            />
          </div>
        </label>

        <Select
          label="Status"
          value={filters.status}
          onChange={set("status")}
          options={meta.statuses}
        />

        <Select
          label="Priority"
          value={filters.priority}
          onChange={set("priority")}
          options={meta.priorities}
        />

        <Select
          label="Category"
          value={filters.category}
          onChange={set("category")}
          options={meta.categories}
        />

        {staff && (
          <Select
            label="Assigned to"
            value={filters.assigned_to}
            onChange={set("assigned_to")}
            options={["Unassigned", ...(admin ? meta.staff : [user.name])]}
          />
        )}

        {filtered && (
          <button
            className="btn-3d clear-btn-3d"
            onClick={() => {
              setFilters(EMPTY);
              setSearch("");
            }}
          >
            <FilterX size={14} aria-hidden="true" />
            <span>Clear</span>
          </button>
        )}
      </section>

      {error && <p className="error error-3d" role="alert">{error}</p>}
      {loading && !tickets.length && (
        <div className="boot-pulse">
          <div className="pulse-loader" />
          <p className="muted">Fetching tickets from cluster…</p>
        </div>
      )}

      {!loading && !error && tickets.length === 0 && (
        <div className="empty-3d">
          <TicketIcon size={36} className="empty-icon-3d" />
          <p>
            {filtered ? "No tickets match the selected filters." : "No tickets yet in this workspace."}
          </p>
          <small>{filtered ? "Try resetting search or filter criteria." : "Create the first ticket to get started."}</small>
        </div>
      )}

      <ul className="tickets-3d">
        {tickets.map((t) => (
          <li key={t.id}>
            <button className={`ticket-3d pri-edge-${t.priority}`} onClick={() => onOpen(t.id)}>
              <span className="t-main-3d">
                <span className="t-title-3d">
                  <span className="t-id-3d">{ticketCode(t.id)}</span>
                  <span className="t-subject-3d">{t.title}</span>
                </span>
                <span className="t-meta-3d">
                  <span className="t-requester-3d">{t.requester_name}</span>
                  <span className="meta-sep">·</span>
                  <span className="t-category-3d">{t.category}</span>
                  <span className="meta-sep">·</span>
                  <span className="t-time-3d">{timeAgo(t.created_at)}</span>
                </span>
              </span>
              <span className="t-badges-3d">
                <PriorityBadge value={t.priority} />
                <StatusBadge value={t.status} />
              </span>
              <span className={`t-agent-3d ${t.assigned_to ? "" : "none"}`}>
                {t.assigned_to ? (
                  <span className="agent-badge-3d">{t.assigned_to}</span>
                ) : (
                  <span className="unassigned-badge-3d">Unassigned</span>
                )}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}