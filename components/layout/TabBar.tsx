"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  BarChart2,
  PlusCircle,
  Bot,
  User,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Home",      icon: Home },
  { href: "/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/dashboard", label: "Add",       icon: PlusCircle, isAction: true },
  { href: "/ai",        label: "AI",        icon: Bot },
  { href: "/profile",   label: "Me",        icon: User },
];

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="tab-bar">
      {NAV_ITEMS.map(({ href, label, icon: Icon, isAction }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={label}
            href={href}
            className={`tab-item${active ? " active" : ""}`}
            style={isAction ? { position: "relative" } : undefined}
          >
            <span
              style={
                isAction
                  ? {
                      background: "var(--electric-blue)",
                      color: "#fff",
                      border: "2px solid var(--ink-black)",
                      borderRadius: "var(--radius-btn)",
                      boxShadow: "var(--shadow)",
                      padding: "0.375rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }
                  : undefined
              }
            >
              <Icon
                size={isAction ? 22 : 20}
                strokeWidth={isAction ? 2.5 : 2}
              />
            </span>
            <span style={{ fontSize: "0.625rem" }}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
