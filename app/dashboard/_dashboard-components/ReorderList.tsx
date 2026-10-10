"use client";

import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { formatUnit, inventoryStatusConfig } from "../utils";

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
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-semibold text-sm">Needs Restocking</h3>
        <span className="ml-auto text-xs text-muted-foreground">
          {items.length}
        </span>
      </div>

      <div className="space-y-1 max-h-90 overflow-y-auto">
        {items.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">
            All items are stocked
          </p>
        )}
        {items.map((item) => {
          const status =
            inventoryStatusConfig[
              item.status as keyof typeof inventoryStatusConfig
            ];
          return (
            <div
              key={item.id}
              onClick={() =>
                router.push(`/dashboard/inventory?search=${item.id}`)
              }
              className="flex items-center gap-2 text-sm p-2 rounded-md cursor-pointer hover:bg-muted"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatUnit(item.quantity, item.unit)} / min{" "}
                  {formatUnit(item.minimumStock, item.unit)}
                </p>
              </div>
              {status && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ${status.className}`}
                >
                  {status.label}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
