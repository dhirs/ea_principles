"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const menuItems = [
  { label: "All Principles", href: "/principles" },
  { label: "Taxonomy", href: "/taxonomy" },
]

export function SidebarMenu() {
  const pathname = usePathname()

  return (
    <nav className="space-y-0.5">
      {menuItems.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              active ? "bg-muted text-foreground" : "hover:bg-muted text-foreground/80"
            }`}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
