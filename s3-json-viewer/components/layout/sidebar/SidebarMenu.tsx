"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, ListChecks, Network, type LucideIcon } from "lucide-react"

const menuItems: { label: string; href: string; icon: LucideIcon }[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "All Principles", href: "/principles", icon: ListChecks },
  { label: "Taxonomy", href: "/taxonomy", icon: Network },
]

export function SidebarMenu() {
  const pathname = usePathname()

  return (
    <nav className="space-y-0.5">
      {menuItems.map((item) => {
        const active =
          item.href === "/"
            ? pathname === "/"
            : pathname === item.href || pathname.startsWith(`${item.href}/`)
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              active ? "bg-muted text-foreground" : "hover:bg-muted text-foreground/80"
            }`}
          >
            <Icon className={`size-4 shrink-0 ${active ? "text-primary" : "text-muted-foreground"}`} />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
