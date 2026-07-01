"use client";

import { useState } from "react";
import { NavPanel } from "@/components/NavPanel";
import { MavenAttendanceReport } from "@/components/reports/MavenAttendanceReport";
import { cn } from "@/lib/utils";

// Each report is a tab. Add new reports here.
const REPORTS = [
  { key: "maven-attendance", label: "Maven Attendance", component: MavenAttendanceReport },
];

export default function ReportsPage() {
  const [active, setActive] = useState(REPORTS[0].key);
  const ActiveReport = REPORTS.find((r) => r.key === active)!.component;

  return (
    <div className="flex">
      <NavPanel />

      <main className="min-w-0 flex-1 p-6">
        <h1 className="mb-4 text-2xl font-semibold tracking-tight">Reports</h1>

        {/* Report tabs */}
        <div className="mb-6 flex gap-1 border-b">
          {REPORTS.map((r) => (
            <button
              key={r.key}
              onClick={() => setActive(r.key)}
              className={cn(
                "-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors",
                active === r.key
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>

        <ActiveReport />
      </main>
    </div>
  );
}
