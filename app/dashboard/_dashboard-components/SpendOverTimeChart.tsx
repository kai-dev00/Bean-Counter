"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatPeso } from "../utils";

type Props = {
  data: { month: string; total: number }[];
};

const chartConfig = {
  total: { label: "Spend", color: "#3b82f6" },
} satisfies ChartConfig;

export function SpendOverTimeChart({ data }: Props) {
  return (
    <div className="border rounded-lg p-5 space-y-3 bg-white">
      <p className="font-semibold text-sm">Purchase Spend (Received)</p>
      <ChartContainer config={chartConfig} className="h-56 w-full">
        <BarChart data={data}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="month" tickLine={false} axisLine={false} />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={60}
            tickFormatter={(v: number) =>
              v >= 1000 ? `₱${(v / 1000).toFixed(0)}k` : `₱${v}`
            }
          />
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                formatter={(value) => formatPeso(Number(value))}
              />
            }
          />
          <Bar dataKey="total" fill="var(--color-total)" radius={4} />
        </BarChart>
      </ChartContainer>
    </div>
  );
}
