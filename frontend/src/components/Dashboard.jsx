import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Flame,
  Inbox,
  ShieldCheck,
  Ticket,
  Timer,
  UserPlus,
  Clock,
  AlertTriangle,
  XCircle,
  TrendingUp,
} from "lucide-react";
import { api } from "../api";
import { formatDuration, initials, isActive, slaInfo, summarise, ticketCode, timeAgo, toDate } from "../utils";
import { PriorityBadge } from "./Badges";
import { Donut, Sparkline, VolumeBars } from "./Charts";
import Card3D from "./Card3D";

const CATEGORY_COLORS = ["#6366f1", "#06b6d4", "#3b82f6", "#10b981", "#f59e0b", "#f97316", "#8b5cf6"];
const SLA_ICON = { ok: Clock, warn: AlertTriangle, bad: XCircle };

function Kpi({ icon: Icon, label, value, sub, tone = "", spark }) {
  return (
    <Card3D className={`kpi-3d ${tone}`} maxTilt={7} scale={1.02}>
      <div className="kpi-head-3d">
        <span className={`kpi-icon-3d ${tone}`}>
          <Icon size={18} aria-hidden="true" />
        </span>
        <span className="kpi-label-3d">{label}</span>
      </div>
      <div className="kpi-body-3d">
        <strong className="kpi-value-3d">{value}</strong>
        <span className={`kpi-sub-3d ${tone}`}>{sub}</span>
      </div>
      {spark && <Sparkline values={spark} />}
    </Card3D>
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
      .then(([s, t]) => {
        setStats(s);
        setTickets(t);
      })
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
      active,
      overdue,
      unassigned,
      avg,
      perDay,
      volume: days.map((day, i) => ({ label: day.label, value: perDay[i] })),
      onTrack: active.length ? Math.round(((active.length - overdue) / active.length) * 100) : 100,
      queue: active.filter((t) => t.assigned_to === user.name).sort((a, b) => slaInfo(b).ratio - slaInfo(a).ratio),
      recent: [...tickets].sort((a, b) => toDate(b.updated_at) - toDate(a.updated_at)).slice(0, 8),
    };
  }, [tickets, user.name]);

  if (error) return <p className="error" role="alert">{error}</p>;
  if (!stats || !d) return <div className="boot-pulse"><div className="pulse-loader" /><p className="muted">Loading</p></div>;

  const categories = Object.entries(stats.by_category).map(([label, value], i) => ({
    label,
    value,
    color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
  }));

  return (
    <>
      <header className="page-head page-head-3d">
        <div>
          <div className="badge-live-ops">
            <span className="live-dot" /> Live IT Operations
          </div>
          <h1>Operations Dashboard</h1>
          <p className="sub">
            {user.role === "admin"
              ? "Real-time telemetry, SLA resolution performance, and active support tickets."
              : "Overview of your assigned queue and the global helpdesk status."}
          </p>
        </div>
      </header>

      <section className="kpis-3d" aria-label="Key telemetry numbers">
        <Kpi
          icon={Ticket}
          label="Open tickets"
          value={d.active.length}
          sub={`${d.perDay[6]} new today`}
          spark={d.perDay}
        />
        <Kpi
          icon={Timer}
          label="Avg resolution"
          value={d.avg === null ? "None yet" : formatDuration(d.avg)}
          sub="resolved and closed"
        />
        <Kpi
          icon={CheckCircle2}
          label="Resolved / closed"
          value={stats.by_status.Resolved + stats.by_status.Closed}
          sub={`of ${stats.total} total`}
          tone="ok"
        />
        <Kpi
          icon={ShieldCheck}
          label="Within SLA target"
          value={`${d.onTrack}%`}
          sub={`${d.overdue} overdue tickets`}
          tone={d.overdue ? "bad" : "ok"}
        />
        <Kpi
          icon={Inbox}
          label="Unassigned"
          value={d.unassigned}
          sub={d.unassigned ? "needs an owner" : "all assigned"}
          tone={d.unassigned ? "warn" : "ok"}
        />
        <Kpi
          icon={Flame}
          label="Urgent & Active"
          value={stats.urgent_active}
          sub="High or Critical"
          tone={stats.urgent_active ? "bad" : "ok"}
        />
      </section>

      <div className="dash-grid-3d">
        <section className="panel-3d flush-3d">
          <div className="panel-head-3d">
            <h2>My Assigned Queue</h2>
            <span className="count-3d">{d.queue.length}</span>
          </div>
          <div className="scroll-3d">
            {d.queue.length === 0 && (
              <div className="empty-note-3d">
                <Inbox size={32} className="empty-icon-3d" />
                <p>No tickets currently assigned to you.</p>
                <small>Open the ticket pool and claim an item.</small>
              </div>
            )}
            {d.queue.slice(0, 6).map((t) => {
              const sla = slaInfo(t);
              const Icon = SLA_ICON[sla.state];
              return (
                <button key={t.id} className="q-item-3d" onClick={() => onOpen(t.id)}>
                  <span className="avatar-sm-3d" aria-hidden="true">
                    {initials(t.requester_name)}
                  </span>
                  <span className="q-body">
                    <div className="q-header-line">
                      <span className="q-code-3d">{ticketCode(t.id)}</span>
                      <PriorityBadge value={t.priority} />
                    </div>
                    <span className="q-title-3d">{t.title}</span>
                    <div className="q-sla-3d">
                      <span className={`sla-label-3d ${sla.state}`}>
                        <Icon size={13} aria-hidden="true" />
                        {sla.label}
                      </span>
                      <span className="q-cat-3d">{t.category}</span>
                    </div>
                    <div className="sla-bar-3d">
                      <span
                        className={`sla-fill-3d ${sla.state}`}
                        style={{ width: `${Math.min(100, sla.ratio * 100)}%` }}
                      />
                    </div>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="panel-3d flush-3d">
          <div className="panel-head-3d">
            <h2>Recent Activity Feed</h2>
            <span className="count-3d count-secondary-3d">{d.recent.length}</span>
          </div>
          <div className="scroll-3d">
            {d.recent.map((t) => {
              const created = Math.abs(toDate(t.updated_at) - toDate(t.created_at)) < 60000;
              const Icon = created
                ? Ticket
                : t.status === "Resolved" || t.status === "Closed"
                  ? CheckCircle2
                  : UserPlus;
              return (
                <button key={t.id} className="a-item-3d" onClick={() => onOpen(t.id)}>
                  <span className="avatar-sm-3d" aria-hidden="true">
                    {initials(created ? t.requester_name : t.assigned_to || "?")}
                  </span>
                  <span className="a-body">
                    <span className="a-line-3d">
                      {created ? (
                        <>
                          <strong>{t.requester_name}</strong> created a ticket
                        </>
                      ) : (
                        <>
                          Status updated to <strong>{t.status}</strong>
                          {t.assigned_to && <> · {t.assigned_to}</>}
                        </>
                      )}
                    </span>
                    <span className="a-sub-3d">
                      {ticketCode(t.id)}: {t.title}
                    </span>
                    <span className="a-time-3d">{timeAgo(t.updated_at)}</span>
                  </span>
                  <Icon size={16} className="a-icon-3d" aria-hidden="true" />
                </button>
              );
            })}
          </div>
        </section>

        <section className="panel-3d">
          <div className="panel-head-3d tight-3d">
            <h2>Analytics & Volume</h2>
          </div>
          <div className="stats-group-3d">
            <p className="chart-title-3d">Distribution by Category</p>
            <Donut data={categories} />
            <div className="chart-divider-3d" />
            <p className="chart-title-3d">7-Day Ticket Influx</p>
            <VolumeBars data={d.volume} />
          </div>
        </section>
      </div>
    </>
  );
}