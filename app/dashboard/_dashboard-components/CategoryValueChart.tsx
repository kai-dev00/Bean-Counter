"use client";

import { Layers } from "lucide-react";
import { formatPeso } from "../utils";
import { DashboardPanel } from "./DashboardPanel";

type Props = {
  data: { name: string; color: string | null; value: number }[];
};

// Ranked bars in the theme color: easier to compare than a pie, and it
// doesn't clash with whatever colors were picked for each category
export function CategoryValueChart({ data }: Props) {
  const total = data.reduce((sum, c) => sum + c.value, 0);
  const max = data[0]?.value ?? 0;

  return (
    <DashboardPanel title="Inventory Value by Category" icon={Layers}>
      {data.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-8">
          No inventory value yet
        </p>
      ) : (
        <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
          {data.map((c) => (
            <div key={c.name} className="space-y-1">
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="truncate">{c.name}</span>
                <span className="shrink-0 font-semibold tabular-nums">
                  {formatPeso(c.value)}
                  <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                    {total > 0 ? Math.round((c.value / total) * 100) : 0}%
                  </span>
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${max > 0 ? (c.value / max) * 100 : 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardPanel>
  );
}
