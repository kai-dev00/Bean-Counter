"use client";

import { Cell, Label, Pie, PieChart } from "recharts";
import { PackageCheck } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { DashboardPanel } from "./DashboardPanel";

type Props = {
  inventories: { status: string | null }[];
};

// Same hues as the status badges, so the chart and the tables agree
const chartConfig = {
  in_stock: { label: "In Stock", color: "#22c55e" },
  low_stock: { label: "Low Stock", color: "#f59e0b" },
  warning: { label: "Warning", color: "#f97316" },
  out_of_stock: { label: "Out of Stock", color: "#ef4444" },
  discontinued: { label: "Discontinued", color: "#94a3b8" },
} satisfies ChartConfig;

type StatusKey = keyof typeof chartConfig;

export function InventoryStatusChart({ inventories }: Props) {
  const slices = (Object.keys(chartConfig) as StatusKey[]).map((key) => ({
    key,
    label: chartConfig[key].label,
    fill: chartConfig[key].color,
    value: inventories.filter((i) => i.status === key).length,
  }));
  const visibleSlices = slices.filter((s) => s.value > 0);
  const total = slices.reduce((sum, s) => sum + s.value, 0);

  return (
    <DashboardPanel title="Stock Health" icon={PackageCheck}>
      {total === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-8">
          No inventory yet
        </p>
      ) : (
        <div className="flex items-center gap-6">
          <ChartContainer
            id="stock-health"
            config={chartConfig}
            className="aspect-square h-44 shrink-0"
          >
            <PieChart>
              <ChartTooltip
                content={<ChartTooltipContent hideLabel nameKey="key" />}
              />
              <Pie
                data={visibleSlices}
                dataKey="value"
                nameKey="key"
                innerRadius={52}
                outerRadius={76}
                strokeWidth={3}
                stroke="var(--card)"
              >
                {visibleSlices.map((s) => (
                  <Cell key={s.key} fill={s.fill} />
                ))}
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) - 6}
                            className="fill-foreground text-2xl font-bold"
                          >
                            {total}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 16}
                            className="fill-muted-foreground text-xs"
                          >
                            items
                          </tspan>
                        </text>
                      );
                    }
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>
          <div className="flex-1 space-y-3">
            {slices.map((s) => (
              <div key={s.key} className="flex items-center gap-2 text-sm">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: s.fill }}
                />
                <span className="text-muted-foreground">{s.label}</span>
                <span className="font-semibold ml-auto tabular-nums">
                  {s.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </DashboardPanel>
  );
}
