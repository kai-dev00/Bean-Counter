"use client";

import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { formatUnit } from "../utils";
import { InventoryStatusBadge } from "../inventory/components/inventoryStatusBadge";
import type { InventoryStatus } from "@/app/generated/prisma/enums";
import { DashboardPanel } from "./DashboardPanel";

type ReorderItem = {
  id: string;
  name: string;
  quantity: number;
  minimumStock: number;
  unit: string;
  status: string | null;
};

type Props = {
  items: ReorderItem[];
};

export function ReorderList({ items }: Props) {
  const router = useRouter();

  return (
    <DashboardPanel
      title="Needs Restocking"
      icon={AlertTriangle}
      action={
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground tabular-nums">
          {items.length}
        </span>
      }
    >
      <div className="space-y-1 max-h-80 overflow-y-auto -mx-2">
        {items.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">
            All items are stocked
          </p>
        )}
        {items.map((item) => {
          const fill =
            item.minimumStock > 0
              ? Math.min(item.quantity / item.minimumStock, 1) * 100
              : 0;
          return (
            <div
              key={item.id}
              onClick={() =>
                router.push(`/dashboard/inventory?search=${item.id}`)
              }
              className="flex items-center gap-3 text-sm px-2 py-2 rounded-md cursor-pointer hover:bg-muted transition-colors"
            >
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium truncate">{item.name}</p>
                  {item.status && (
                    <InventoryStatusBadge
                      status={item.status as InventoryStatus}
                    />
                  )}
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${fill}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground tabular-nums">
                  {formatUnit(item.quantity, item.unit)} of{" "}
                  {formatUnit(item.minimumStock, item.unit)} minimum
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </DashboardPanel>
  );
}
