"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, History, Settings, Code, ShieldCheck, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "History", href: "/dashboard/history", icon: History },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r bg-card/50 hidden md:flex flex-col">
      <div className="p-6 flex-1">
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

        <div className="mt-12">
          <h4 className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Insights
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

      <div className="p-6 border-t">
        <div className="bg-muted/50 rounded-xl p-4 text-center">
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1">
            Beta Version
          </p>
          <p className="text-xs text-muted-foreground">
            More features coming soon.
          </p>
        </div>
      </div>
    </aside>
  );
}
