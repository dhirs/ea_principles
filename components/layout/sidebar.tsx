import Link from "next/link"

const navItems = [
  { label: "Dashboard", href: "/" },
  { label: "Principles", href: "/principles" },
  { label: "Settings", href: "/settings" },
]

export function Sidebar() {
  return (
    <aside className="w-64 shrink-0 bg-card shadow-md text-sidebar-foreground">
      <nav className="p-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block px-4 py-2.5 rounded-md text-sm font-semibold tracking-tight hover:bg-muted transition-colors"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
