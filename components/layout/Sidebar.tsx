"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      style={{
        width: "200px",
        borderRight: "1px solid #ccc",
        padding: "20px",
        minHeight: "100vh",
      }}
    >
      <nav style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {navItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                padding: "8px 12px",
                textDecoration: "none",
                borderRadius: "6px",
                color: isActive ? "white" : "black",
                backgroundColor: isActive ? "#0070f3" : "transparent",
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
