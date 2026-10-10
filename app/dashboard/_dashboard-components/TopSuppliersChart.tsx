"use client";

import { Bar, BarChart, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatPeso } from "../utils";

type Props = {
  data: { name: string; total: number }[];
};

const chartConfig = {
  total: { label: "Spend", color: "#8b5cf6" },
} satisfies ChartConfig;

export function TopSuppliersChart({ data }: Props) {
  return (
    <div className="border rounded-lg p-5 space-y-3 bg-white">
      <p className="font-semibold text-sm">Top Suppliers by Spend</p>
      {data.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-8">
          No received purchases yet
        </p>
      ) : (
        <ChartContainer config={chartConfig} className="h-56 w-full">
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
      )}
    </div>
  );
}
