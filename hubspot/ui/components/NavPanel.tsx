"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, CalendarDays, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Leads", icon: Users },
  { href: "/events", label: "Events", icon: CalendarDays },
  { href: "/reports", label: "Reports", icon: BarChart3 },
];

// Slim left menu. Only Leads / Events. When the already-active item is clicked,
// navigation is suppressed and `onActiveClick` fires instead (used on the leads
// page to toggle the filters panel).
export function NavPanel({ onActiveClick }: { onActiveClick?: (href: string) => void }) {
  const pathname = usePathname();
  return (
    <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-56 shrink-0 overflow-y-auto border-r bg-card/40 p-4 md:block">
      <nav className="space-y-1">
        {LINKS.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={(e) => {
                if (active && onActiveClick) {
                  e.preventDefault();
                  onActiveClick(href);
                }
              }}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
