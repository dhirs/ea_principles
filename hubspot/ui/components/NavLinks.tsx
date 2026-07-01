"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Leads", icon: Users },
  { href: "/events", label: "Events", icon: CalendarDays },
];

export function NavLinks() {
  const pathname = usePathname();
  return (
    <nav className="space-y-1">
      {LINKS.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
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
  );
}
