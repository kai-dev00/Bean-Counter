"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useRealtime } from "@upstash/realtime/client";
import { StatsCard } from "@/components/StatsCard";
import {
  Activity,
  TrendingUp,
  AlertTriangle,
  ShoppingCart,
  ClipboardList,
} from "lucide-react";
import type { RealtimeEvents } from "@/lib/upstash/realtime";
import { formatPeso } from "../utils";
import { InventoryStatusChart } from "./InventoryStatusChart";
import { SpendOverTimeChart } from "./SpendOverTimeChart";
import { CategoryValueChart } from "./CategoryValueChart";
import { TopSuppliersChart } from "./TopSuppliersChart";
import { ReorderList } from "./ReorderList";

type ActivityItem = {
  id: string;
  action: string;
  module: string;
  submodule: string | null;
  recordId: string | null;
  createdAt: string;
  user: { fullName: string | null } | null;
};

type Props = {
  totalInventoryValue: number;
  lowStockCount: number;
  spendThisMonth: number;
  spendTrend: number | null;
  pendingPurchases: { count: number; total: number };
  monthlySpend: { month: string; total: number }[];
  categoryValues: { name: string; color: string | null; value: number }[];
  topSuppliers: { name: string; total: number }[];
  reorderItems: {
    id: string;
    name: string;
    quantity: number;
    minimumStock: number;
    unit: string;
    status: string | null;
  }[];
  recentActivity: ActivityItem[];
  inventories: { status: string | null }[];
};

const actionColors = {
  create: "bg-green-500",
  update: "bg-blue-500",
  delete: "bg-red-500",
};

const moduleRoutes: Record<string, string> = {
  inventory: "/dashboard/inventory",
  category: "/dashboard/category",
  supplier: "/dashboard/supplier",
  purchase: "/dashboard/purchase",
  "access-management:users": "/dashboard/accessManagement/users",
  "access-management:roles": "/dashboard/accessManagement/roles",
};

export default function DashboardClient({
  totalInventoryValue,
  lowStockCount,
  spendThisMonth,
  spendTrend,
  pendingPurchases,
  monthlySpend,
  categoryValues,
  topSuppliers,
  reorderItems,
  recentActivity,
  inventories,
}: Props) {
  const router = useRouter();
  const [liveActivities, setLiveActivities] =
    useState<ActivityItem[]>(recentActivity);

  useRealtime<RealtimeEvents, "activity.created">({
    events: ["activity.created"],
    onData({ data }) {
      setLiveActivities((prev) => {
        const exists = prev.some((a) => a.recordId === data.recordId);
        if (exists) return prev;
        return [
          {
            id: crypto.randomUUID(),
            action: data.action,
            module: data.module,
            submodule: data.submodule,
            recordId: data.recordId,
            createdAt: data.createdAt,
            user: { fullName: data.user },
          },
          ...prev.slice(0, 9),
        ];
      });
    },
  });

  const handleActivityClick = (activity: ActivityItem) => {
    if (activity.action === "delete") return;
    const routeKey = activity.submodule
      ? `${activity.module}:${activity.submodule}`
      : activity.module;
    const route = moduleRoutes[routeKey] ?? moduleRoutes[activity.module];
    if (!route) return;
    if (activity.recordId) {
      router.push(`${route}?search=${activity.recordId}`);
    } else {
      router.push(route);
    }
  };

  return (
    <div className="space-y-6 flex gap-x-4 ">
      {/* //left */}
      <section className="w-3/4 flex gap-y-4 flex-col">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Inventory Value"
            value={formatPeso(totalInventoryValue)}
            icon={TrendingUp}
            color="success"
            description="Based on unit prices"
          />
          <StatsCard
            title="Low Stock Items"
            value={lowStockCount}
            icon={AlertTriangle}
            color={lowStockCount > 0 ? "warning" : "default"}
            description="Needs restocking"
          />
          <StatsCard
            title="Spend This Month"
            value={formatPeso(spendThisMonth)}
            icon={ShoppingCart}
            color="default"
            trend={spendTrend !== null ? { value: spendTrend } : undefined}
            description="Received purchases"
          />
          <StatsCard
            title="Pending Orders"
            value={pendingPurchases.count}
            icon={ClipboardList}
            color="default"
            description={`${formatPeso(pendingPurchases.total)} in drafts`}
          />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <SpendOverTimeChart data={monthlySpend} />
          <CategoryValueChart data={categoryValues} />
          <TopSuppliersChart data={topSuppliers} />
          <div className="bg-white">
            <InventoryStatusChart inventories={inventories} />
          </div>
        </div>
      </section>
      {/* right */}
      <section className="w-1/4  flex flex-col gap-y-4">
        <ReorderList items={reorderItems} />

        <div className="border rounded-lg p-4 space-y-3 ">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold text-sm">Recent Activity</h3>
            <span className="ml-auto flex items-center gap-1 text-xs text-green-500">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Live
            </span>
          </div>

          <div className="space-y-2 max-h-90 overflow-y-auto">
            {liveActivities.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">
                No recent activity
              </p>
            )}
            {liveActivities.map((activity) => (
              <div
                key={activity.id}
                onClick={() => handleActivityClick(activity)}
                className={`flex items-start gap-3 text-sm p-2 rounded-md transition-colors ${
                  (moduleRoutes[`${activity.module}:${activity.submodule}`] ??
                    moduleRoutes[activity.module]) &&
                  activity.action !== "delete"
                    ? "cursor-pointer hover:bg-muted"
                    : ""
                }`}
              >
                <span
                  className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                    actionColors[
                      activity.action as keyof typeof actionColors
                    ] ?? "bg-gray-400"
                  }`}
                />
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-medium">
                      {activity.user?.fullName ?? "System"}
                    </span>{" "}
                    {activity.action}d in{" "}
                    <span className="font-medium capitalize">
                      {activity.module}
                    </span>
                    {activity.submodule && (
                      <>
                        {" › "}
                        <span className="font-medium capitalize">
                          {activity.submodule}
                        </span>
                      </>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(activity.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
