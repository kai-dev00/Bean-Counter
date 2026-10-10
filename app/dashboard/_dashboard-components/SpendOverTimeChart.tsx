"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { BarChart3 } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatPeso } from "../utils";
import { DashboardPanel } from "./DashboardPanel";

type Props = {
  data: { month: string; total: number }[];
};

const chartConfig = {
  total: { label: "Spend", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function SpendOverTimeChart({ data }: Props) {
  return (
    <DashboardPanel title="Purchase Spend (6 months)" icon={BarChart3}>
      <ChartContainer
        id="spend-over-time"
        config={chartConfig}
        className="h-52 w-full"
      >
        <BarChart data={data}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="month" tickLine={false} axisLine={false} />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={56}
            tickFormatter={(v: number) =>
              v >= 1000 ? `₱${(v / 1000).toFixed(0)}k` : `₱${v}`
            }
          />
          <ChartTooltip
            cursor={{ fill: "var(--muted)" }}
            content={
              <ChartTooltipContent
                formatter={(value) => formatPeso(Number(value))}
              />
            }
          />
          <Bar
            dataKey="total"
            fill="var(--color-total)"
            radius={[6, 6, 0, 0]}
            maxBarSize={40}
          />
        </BarChart>
      </ChartContainer>
    </DashboardPanel>
  );
}
