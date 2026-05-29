import { BestPracticeFilter } from "./BestPracticeFilter"
import { FocusAreaFilter } from "./FocusAreaFilter"
import { MaturityFilter } from "./MaturityFilter"
import { PillarFilter } from "./PillarFilter"
import { SearchPrinciples } from "./SearchPrinciples"
import { SidebarMenu } from "./SidebarMenu"

export function Sidebar() {
  return (
    <aside className="w-64 shrink-0 bg-card shadow-md text-sidebar-foreground overflow-y-auto">
      <div className="p-4 space-y-4">
        <SidebarMenu />
        <SearchPrinciples />
        <PillarFilter />
        <FocusAreaFilter />
        <MaturityFilter />
        <BestPracticeFilter />
      </div>
    </aside>
  )
}
