"use client"

import { useMemo } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { HeaderBar } from "./sections/HeaderBar"
import { getSectionEntries } from "@/lib/principles/registry"
import type { Principle } from "@/lib/principles/types"

export function PrincipleView({ principle }: { principle: Principle }) {
  const sections = useMemo(() => getSectionEntries(principle), [principle])

  return (
    <article className="space-y-6 w-full">
      <HeaderBar principle={principle} />
      {sections.length === 0 ? (
        <p className="text-muted-foreground">This principle has no displayable fields.</p>
      ) : (
        <Tabs defaultValue={sections[0].key}>
          <div className="overflow-x-auto -mx-1 px-1 pb-1">
            <TabsList className="w-full shadow-md bg-card">
              {sections.map((s) => (
                <TabsTrigger key={s.key} value={s.key}>
                  {s.title}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          {sections.map((s) => (
            <TabsContent key={s.key} value={s.key} className="mt-5">
              <div className="rounded-2xl bg-card p-8 shadow-lg">{s.content}</div>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </article>
  )
}
