// The API sends UTC times without a "Z"; add it so the browser converts to local time.
export function toDate(value) {
  return new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(value) ? value : value + "Z");
}

export function timeAgo(value) {
  const seconds = Math.max(0, (Date.now() - toDate(value).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} h ago`;
  return `${Math.floor(seconds / 86400)} d ago`;
}

export function initials(name = "") {
  return name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join("");
}

// 7 becomes "TKT-0007"
export const ticketCode = (id) => `TKT-${String(id).padStart(4, "0")}`;

export const isActive = (t) => t.status === "Open" || t.status === "In Progress";

// 4500000 ms becomes "1h 15m"
export function formatDuration(ms) {
  const minutes = Math.max(0, Math.round(ms / 60000));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m`;
  return `${Math.floor(hours / 24)}d ${hours % 24}h`;
}

export const AI_LABELS = {
  groq: "Groq AI",
  gemini: "Gemini AI",
  fallback: "Keyword rules (AI unavailable)",
};

// Simple demo SLA: hours the team has to handle a ticket, by priority.
export const SLA_HOURS = { Critical: 4, High: 8, Medium: 24, Low: 72 };

// How far through its time limit an active ticket is. Finished tickets return null.
//   ratio: 0 = just created, 1 = deadline reached     state: "ok" | "warn" | "bad"
export function slaInfo(ticket) {
  if (!isActive(ticket)) return null;
  const limit = SLA_HOURS[ticket.priority] * 3600000;
  const age = Date.now() - toDate(ticket.created_at).getTime();
  const ratio = age / limit;
  if (ratio >= 1) return { state: "bad", ratio, label: `Overdue by ${formatDuration(age - limit)}` };
  return { state: ratio >= 0.75 ? "warn" : "ok", ratio, label: `Due in ${formatDuration(limit - age)}` };
}

// Numbers for the sidebar badge and the notification bell.
export function summarise(tickets) {
  const active = tickets.filter(isActive);
  return {
    active: active.length,
    unassigned: active.filter((t) => !t.assigned_to).length,
    overdue: active.filter((t) => slaInfo(t).state === "bad").length,
    urgent: active.filter((t) => t.priority === "High" || t.priority === "Critical").length,
  };
}

// Roles: "admin" sees everything, "agent" works on assigned tickets, "employee" sees only their own.
export const isStaff = (user) => user.role === "admin" || user.role === "agent";
export const ROLE_LABELS = { admin: "Admin", agent: "Support agent", employee: "Employee" };