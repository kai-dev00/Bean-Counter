"use client";

import { Bar, BarChart, XAxis, YAxis } from "recharts";
import { Truck } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatPeso } from "../utils";
import { DashboardPanel } from "./DashboardPanel";

type Props = {
  data: { name: string; total: number }[];
};

const chartConfig = {
  total: { label: "Spend", color: "var(--chart-2)" },
} satisfies ChartConfig;

export function TopSuppliersChart({ data }: Props) {
  return (
    <DashboardPanel title="Top 5 Suppliers by Spend" icon={Truck}>
      {data.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-8">
          No received purchases yet
        </p>
      ) : (
        <ChartContainer
          id="top-suppliers"
          config={chartConfig}
          className="h-52 w-full"
        >
          <BarChart data={data} layout="vertical" margin={{ left: 8 }}>
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              tickLine={false}
              axisLine={false}
              width={100}
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
              radius={[0, 6, 6, 0]}
              maxBarSize={28}
            />
          </BarChart>
        </ChartContainer>
      )}
    </DashboardPanel>
  );
}
