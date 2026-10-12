import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Flame, Inbox, ShieldCheck, Ticket, Timer, UserPlus, Clock, AlertTriangle, XCircle } from "lucide-react";
import { api } from "../api";
import { formatDuration, initials, isActive, slaInfo, summarise, ticketCode, timeAgo, toDate } from "../utils";
import { PriorityBadge } from "./Badges";
import { Donut, Sparkline, VolumeBars } from "./Charts";

const CATEGORY_COLORS = ["#6366f1", "#2b8cf0", "#14b8c4", "#6cbf6a", "#d9a441", "#e07b39", "#9aa3b2"];
const SLA_ICON = { ok: Clock, warn: AlertTriangle, bad: XCircle };

function Kpi({ icon: Icon, label, value, sub, tone = "", spark }) {
  return (
    <div className="kpi">
      <div className="kpi-head">
        <span className="kpi-icon"><Icon size={17} aria-hidden="true" /></span>
        <span className="kpi-label">{label}</span>
      </div>
      <strong className="kpi-value">{value}</strong>
      <span className={`kpi-sub ${tone}`}>{sub}</span>
      {spark && <Sparkline values={spark} />}
    </div>
  );
}

function lastSevenDays() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000);
    return { key: d.toLocaleDateString("en-CA"), label: d.toLocaleDateString(undefined, { weekday: "short" }) };
  });
}

export default function Dashboard({ user, onOpen }) {
  const [stats, setStats] = useState(null);
  const [tickets, setTickets] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.stats(), api.listTickets()])
      .then(([s, t]) => { setStats(s); setTickets(t); })
      .catch((e) => setError(e.message));
  }, []);

  const d = useMemo(() => {
    if (!tickets) return null;
    const active = tickets.filter(isActive);
    const finished = tickets.filter((t) => !isActive(t));
    const avg = finished.length
      ? finished.reduce((sum, t) => sum + (toDate(t.updated_at) - toDate(t.created_at)), 0) / finished.length
      : null;
    const days = lastSevenDays();
    const perDay = days.map(({ key }) => tickets.filter((t) => toDate(t.created_at).toLocaleDateString("en-CA") === key).length);
    const { overdue, unassigned } = summarise(tickets);
    return {
      active, overdue, unassigned, avg, perDay,
      volume: days.map((day, i) => ({ label: day.label, value: perDay[i] })),
      onTrack: active.length ? Math.round(((active.length - overdue) / active.length) * 100) : 100,
      queue: active.filter((t) => t.assigned_to === user.name).sort((a, b) => slaInfo(b).ratio - slaInfo(a).ratio),
      recent: [...tickets].sort((a, b) => toDate(b.updated_at) - toDate(a.updated_at)).slice(0, 8),
    };
  }, [tickets, user.name]);

  if (error) return <p className="error" role="alert">{error}</p>;
  if (!stats || !d) return <p className="muted">Loading dashboard…</p>;

  const categories = Object.entries(stats.by_category).map(([label, value], i) => ({ label, value, color: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }));

  return (
    <>
      <header className="page-head">
        <div>
          <h1>Dashboard</h1>
          <p className="sub">{user.role === "admin" ? "Overview of all support operations" : "Overview of your tickets and the unassigned queue"}</p>
        </div>
      </header>

      <section className="kpis" aria-label="Key numbers">
        <Kpi icon={Ticket} label="Open tickets" value={d.active.length} sub={`${d.perDay[6]} new today`} spark={d.perDay} />
        <Kpi icon={Timer} label="Avg resolution time" value={d.avg === null ? "None yet" : formatDuration(d.avg)} sub="resolved and closed" />
        <Kpi icon={CheckCircle2} label="Resolved or closed" value={stats.by_status.Resolved + stats.by_status.Closed} sub={`of ${stats.total} total`} tone="ok" />
        <Kpi icon={ShieldCheck} label="Within target time" value={`${d.onTrack}%`} sub={`${d.overdue} overdue`} tone={d.overdue ? "bad" : "ok"} />
        <Kpi icon={Inbox} label="Unassigned tickets" value={d.unassigned} sub={d.unassigned ? "need an owner" : "all assigned"} tone={d.unassigned ? "warn" : "ok"} />
        <Kpi icon={Flame} label="Urgent and active" value={stats.urgent_active} sub="High or Critical" tone={stats.urgent_active ? "bad" : "ok"} />
      </section>

      <div className="dash-grid">
        <section className="panel flush">
          <div className="panel-head"><h2>My queue</h2><span className="count">{d.queue.length}</span></div>
          <div className="scroll">
            {d.queue.length === 0 && <p className="empty-note">Nothing is assigned to you. Open Tickets and pick one up.</p>}
            {d.queue.slice(0, 6).map((t) => {
              const sla = slaInfo(t);
              const Icon = SLA_ICON[sla.state];
              return (
                <button key={t.id} className="q-item" onClick={() => onOpen(t.id)}>
                  <span className="avatar-sm" aria-hidden="true">{initials(t.requester_name)}</span>
                  <span className="q-body">
                    <span className="q-code">{ticketCode(t.id)}</span>
                    <span className="q-title">{t.title}</span>
                    <span className="q-tags"><PriorityBadge value={t.priority} /></span>
                    <span className="q-sla">
                      <span className={`sla-label ${sla.state}`}><Icon size={14} aria-hidden="true" />{sla.label}</span>
                      <span className="q-cat">{t.category}</span>
                    </span>
                    <span className="sla-bar"><span className={sla.state} style={{ width: `${Math.min(100, sla.ratio * 100)}%` }} /></span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="panel flush">
          <div className="panel-head"><h2>Recent activity</h2><span className="count">{d.recent.length}</span></div>
          <div className="scroll">
            {d.recent.map((t) => {
              const created = Math.abs(toDate(t.updated_at) - toDate(t.created_at)) < 60000;
              const Icon = created ? Ticket : t.status === "Resolved" || t.status === "Closed" ? CheckCircle2 : UserPlus;
              return (
                <button key={t.id} className="a-item" onClick={() => onOpen(t.id)}>
                  <span className="avatar-sm" aria-hidden="true">{initials(created ? t.requester_name : t.assigned_to || "?")}</span>
                  <span className="a-body">
                    <span className="a-line">
                      {created ? <><b>{t.requester_name}</b> created a new ticket</> : <>Ticket is now <b>{t.status}</b>{t.assigned_to && <> · {t.assigned_to}</>}</>}
                    </span>
                    <span className="a-sub">{ticketCode(t.id)}: {t.title}</span>
                    <span className="a-time">{timeAgo(t.updated_at)}</span>
                  </span>
                  <Icon size={16} className="a-icon" aria-hidden="true" />
                </button>
              );
            })}
          </div>
        </section>

        <section className="panel">
          <div className="panel-head tight"><h2>Quick stats</h2></div>
          <p className="chart-title">Tickets by category</p>
          <Donut data={categories} />
          <p className="chart-title">Tickets created, last 7 days</p>
          <VolumeBars data={d.volume} />
        </section>
      </div>
    </>
  );
}