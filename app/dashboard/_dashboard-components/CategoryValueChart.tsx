"use client";

import { Cell, Pie, PieChart } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatPeso } from "../utils";

type Props = {
  data: { name: string; color: string | null; value: number }[];
};

const fallbackColors = ["#3b82f6", "#22c55e", "#f59e0b", "#a855f7", "#ef4444"];

export function CategoryValueChart({ data }: Props) {
  const slices = data.map((c, i) => ({
    ...c,
    fill: c.color ?? fallbackColors[i % fallbackColors.length],
  }));
  const chartConfig = Object.fromEntries(
    slices.map((c) => [c.name, { label: c.name, color: c.fill }]),
  ) satisfies ChartConfig;

  return (
    <div className="border rounded-lg p-5 space-y-3 bg-white">
      <p className="font-semibold text-sm">Inventory Value by Category</p>
      {slices.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-8">
          No inventory value yet
        </p>
      ) : (
        <>
          <ChartContainer config={chartConfig} className="h-44 w-full">
            <PieChart>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    hideLabel
                    formatter={(value, name) => (
                      <span>
                        {name}: {formatPeso(Number(value))}
                      </span>
                    )}
                  />
                }
              />
              <Pie
                data={slices}
                dataKey="value"
                nameKey="name"
                innerRadius={45}
                outerRadius={75}
              >
                {slices.map((c) => (
                  <Cell key={c.name} fill={c.fill} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
          <div className="space-y-1">
            {slices.map((c) => (
              <div key={c.name} className="flex items-center gap-2 text-xs">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: c.fill }}
                />
                <span className="text-muted-foreground truncate">{c.name}</span>
                <span className="font-medium ml-auto">
                  {formatPeso(c.value)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
