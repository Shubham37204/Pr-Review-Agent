"use client";

interface SeverityBadgeProps {
  severity: "critical" | "warning" | "suggestion";
  count?: number;
}

const severityConfig = {
  critical: { label: "Critical", color: "red" },
  warning: { label: "Warning", color: "orange" },
  suggestion: { label: "Suggestion", color: "blue" },
};

export default function SeverityBadge({ severity, count }: SeverityBadgeProps) {
  const config = severityConfig[severity];

  return (
    <span
      style={{
        display: "inline-block",
        padding: "4px 10px",
        borderRadius: "999px",
        fontSize: "12px",
        fontWeight: 500,
        color: "white",
        backgroundColor: config.color,
      }}
    >
      {config.label}
      {count !== undefined ? ` (${count})` : ""}
    </span>
  );
}
