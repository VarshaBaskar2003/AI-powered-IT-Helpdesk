import { AlertTriangle } from "lucide-react";

export function PriorityBadge({ value }) {
  const urgent = value === "Critical" || value === "High";
  return (
    <span className={`pill-3d pri-${value}`}>
      <span className="pill-3d-dot" aria-hidden="true" />
      {urgent && <AlertTriangle size={12} className="pri-icon-urgent" aria-hidden="true" />}
      <span className="pill-3d-label">{value}</span>
    </span>
  );
}

export function StatusBadge({ value }) {
  const statusKey = value ? value.replace(/\s+/g, "") : "Open";
  return (
    <span className={`pill-3d status status-${statusKey}`}>
      <span className="pill-3d-dot pulse" aria-hidden="true" />
      <span className="pill-3d-label">{value}</span>
    </span>
  );
}

export default { PriorityBadge, StatusBadge };