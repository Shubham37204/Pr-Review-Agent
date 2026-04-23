"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  History,
  BarChart2,
  ChevronLeft,
  ChevronRight,
  GitCompare,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("sidebar_collapsed");
    if (stored === "true") {
      setIsCollapsed(true);
    }
  }, []);

  const toggleCollapse = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem("sidebar_collapsed", nextState.toString());
  };

  if (!mounted) return null; // Prevent hydration mismatch

  return (
    <aside
      className={cn(
        "border-r bg-card/50 hidden md:flex flex-col transition-all duration-300 relative",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className={cn("p-3 border-b flex", isCollapsed ? "justify-center" : "justify-end")}>
        <button
          onClick={toggleCollapse}
          className="p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors flex items-center justify-center"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      <div className="p-3 flex-1 overflow-y-auto overflow-x-hidden space-y-6">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-lg transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  isCollapsed && "justify-center px-0"
                )}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Pro Features Section */}
        <div>
          {!isCollapsed && (
            <h4 className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
              Advanced
            </h4>
          )}
          <nav className="space-y-2">
            {proItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-lg transition-all group",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    isCollapsed && "justify-center px-0 relative"
                  )}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {!isCollapsed && <span className="flex-1">{item.label}</span>}
                  
                  {item.badge && (
                    isCollapsed ? (
                      <span className={cn("absolute top-1 right-1 w-2 h-2 rounded-full", item.badgeColor)} />
                    ) : (
                      <span
                        className={cn(
                          "text-[9px] font-bold text-white px-1.5 py-0.5 rounded-full uppercase tracking-wide",
                          item.badgeColor
                        )}
                      >
                        {item.badge}
                      </span>
                    )
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </aside>
  );
}
