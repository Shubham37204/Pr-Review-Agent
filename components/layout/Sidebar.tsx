"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  History,
  BarChart2,
  Code,
  ShieldCheck,
  Zap,
  GitCompare,
  Webhook,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "History", href: "/dashboard/history", icon: History },
  { label: "Usage", href: "/dashboard/settings", icon: BarChart2 },
];

const proItems = [
  {
    label: "Compare Reviews",
    href: "/dashboard/compare",
    icon: GitCompare,
    badge: "New",
    badgeColor: "bg-blue-500",
  },
  {
    label: "Webhooks",
    href: "/dashboard/webhooks",
    icon: Webhook,
    badge: "Live",
    badgeColor: "bg-emerald-500",
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r bg-card/50 hidden md:flex flex-col">
      <div className="p-6 flex-1 overflow-y-auto">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Pro / Wow Features Section */}
        <div className="mt-8">
          <h4 className="px-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
            <Zap className="w-3 h-3 text-amber-500" />
            Advanced
          </h4>
          <nav className="space-y-1">
            {proItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all group",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="flex-1">{item.label}</span>
                  <span
                    className={cn(
                      "text-[9px] font-bold text-white px-1.5 py-0.5 rounded-full uppercase tracking-wide",
                      item.badgeColor
                    )}
                  >
                    {item.badge}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Analysis Pillars */}
        <div className="mt-8">
          <h4 className="px-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
            Review Pillars
          </h4>
          <div className="space-y-1">
            <div className="flex items-center gap-3 px-4 py-2 text-xs text-muted-foreground">
              <Zap className="w-3 h-3 text-amber-500" />
              Scalability
            </div>
            <div className="flex items-center gap-3 px-4 py-2 text-xs text-muted-foreground">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              Security
            </div>
            <div className="flex items-center gap-3 px-4 py-2 text-xs text-muted-foreground">
              <Code className="w-3 h-3 text-blue-500" />
              Code Quality
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 border-t">
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-4 border border-primary/10">
          <p className="text-[10px] text-primary font-bold uppercase tracking-widest mb-1">
            Webhook Ready
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Auto-trigger reviews when a PR is opened on GitHub.
          </p>
          <Link href="/dashboard/webhooks">
            <p className="text-[11px] text-primary font-semibold mt-2 hover:underline">
              Configure →
            </p>
          </Link>
        </div>
      </div>
    </aside>
  );
}
