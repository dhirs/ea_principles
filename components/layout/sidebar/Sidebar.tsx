import { SearchPrinciples } from "./SearchPrinciples"
import { SidebarMenu } from "./SidebarMenu"

export function Sidebar() {
  return (
    <aside className="w-64 shrink-0 bg-card shadow-md text-sidebar-foreground overflow-y-auto">
      <div className="p-4 space-y-4">
        <SidebarMenu />
        <SearchPrinciples />
      </div>
    </aside>
  )
}
