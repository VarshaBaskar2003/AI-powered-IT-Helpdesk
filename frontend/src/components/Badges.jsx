import { AlertTriangle } from "lucide-react";

export function PriorityBadge({ value }) {
  const urgent = value === "Critical" || value === "High";
  return (
    <span className={`pill pri-${value}`}>
      {urgent && <AlertTriangle size={12} aria-hidden="true" />}
      {value}
    </span>
  );
}

export function StatusBadge({ value }) {
  return <span className={`pill status status-${value.replace(" ", "")}`}>{value}</span>;
}