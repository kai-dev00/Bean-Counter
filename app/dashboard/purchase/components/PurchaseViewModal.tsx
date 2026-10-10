"use client";

import { CustomModal } from "@/components/CustomModal";
import { formatDate, formatPeso, purchaseStatusConfig } from "../../utils";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PurchaseWithDetails } from "./PurchaseClient";

type Props = {
  purchase: PurchaseWithDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PurchaseViewModal({ purchase, open, onOpenChange }: Props) {
  if (!purchase) return null;

  const config = purchaseStatusConfig[purchase.status];

  return (
    <CustomModal
      open={open}
      onOpenChange={onOpenChange}
      title={`PO-${purchase.id.slice(0, 8).toUpperCase()}`}
      size="lg"
    >
      <div className="space-y-4 text-sm">
        {/* Status + Supplier */}
        <div className="flex items-center gap-2">
          <Badge className={cn(config.className)}>{config.label}</Badge>
          <span className="text-muted-foreground text-xs border rounded-full px-2 py-0.5">
            {purchase.supplier?.name}
          </span>
        </div>

        {/* Notes */}
        {purchase.notes && (
          <p className="text-muted-foreground">{purchase.notes}</p>
        )}

        <hr />

        {/* Items Table */}
        <div className="space-y-2">
          <p className="font-medium text-xs text-muted-foreground uppercase tracking-wide">
            Items
          </p>
          <div className="grid grid-cols-[3fr_1fr_1fr_1fr] gap-2 text-xs text-muted-foreground px-1">
            <span>Item</span>
            <span>Qty</span>
            <span>Unit Cost</span>
            <span className="text-right">Total</span>
          </div>
          <div className="space-y-1">
            {purchase.items.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-[3fr_1fr_1fr_1fr] gap-2 border rounded-lg px-3 py-2 text-sm"
              >
                <span className="font-medium">{item.inventory.name}</span>
                <span>
                  {item.quantity} {item.inventory.unit.toLowerCase()}
                </span>
                <span>{formatPeso(item.unitCost)}</span>
                <span className="text-right font-medium">
                  {formatPeso(item.quantity * item.unitCost)}
                </span>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="flex justify-end pt-2 border-t">
            <span className="font-semibold">
              Total: {formatPeso(purchase.total)}
            </span>
          </div>
        </div>

        <hr />

        {/* Audit Info */}
        <div className="space-y-2 text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>Created by</span>
            <span className="text-foreground">
              {purchase.createdBy || "N/A"} · {formatDate(purchase.createdAt)}
            </span>
          </div>

          {purchase.updatedBy && purchase.updatedAt && (
            <div className="flex justify-between">
              <span>Last updated by</span>
              <span className="text-foreground">
                {purchase.updatedBy} · {formatDate(purchase.updatedAt)}
              </span>
            </div>
          )}
        </div>
      </div>
    </CustomModal>
  );
}
