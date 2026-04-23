"use client";

import { Badge } from "@/components/ui/badge";
import { AlertCircle, AlertTriangle, Lightbulb } from "lucide-react";

interface SeverityBadgeProps {
  severity: "critical" | "warning" | "suggestion";
  count?: number;
}

export default function SeverityBadge({ severity, count }: SeverityBadgeProps) {
  const config = {
    critical: { label: "Critical", variant: "destructive" as const, icon: AlertCircle },
    warning: { label: "Warning", variant: "warning" as const, icon: AlertTriangle },
    suggestion: { label: "Suggestion", variant: "info" as const, icon: Lightbulb },
  }[severity];

  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="gap-1.5 px-3 py-1 text-xs font-bold uppercase tracking-wider">
      <Icon className="w-3 h-3" />
      {config.label}
      {count !== undefined && <span className="ml-1 opacity-70">({count})</span>}
    </Badge>
  );
}
