"use client";

import { Badge } from "@/components/ui/badge";
import { Zap, ShieldCheck, Code2, Activity } from "lucide-react";

interface CategoryBadgeProps {
  category: "scalability" | "security" | "quality" | "performance";
}

export default function CategoryBadge({ category }: CategoryBadgeProps) {
  const config = {
    scalability: { label: "Scalability", variant: "warning" as const, icon: Zap },
    security: { label: "Security", variant: "destructive" as const, icon: ShieldCheck },
    quality: { label: "Quality", variant: "info" as const, icon: Code2 },
    performance: { label: "Performance", variant: "secondary" as const, icon: Activity },
  }[category];

  const Icon = config.icon;

  return (
    <Badge variant="outline" className="gap-1.5 px-3 py-1 text-[10px] font-bold uppercase tracking-widest border-muted-foreground/30">
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  );
}
