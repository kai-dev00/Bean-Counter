import { InventoryStatus, PurchaseStatus } from "@/app/generated/prisma/enums";
import { Decimal } from "@prisma/client/runtime/client";

export function computeInventoryStatus(
  quantity: number,
  minimumStock: number,
  discontinued = false,
): InventoryStatus {
  // Manually set; stock changes never override it
  if (discontinued) return "discontinued";

  if (quantity === 0) return "out_of_stock";

  if (minimumStock <= 0) return "in_stock";

  const ratio = quantity / minimumStock;

  if (ratio <= 1) return "warning"; // at or below minimum
  if (ratio <= 1.5) return "low_stock"; // within buffer zone

  return "in_stock";
}

export function formatPeso(amount: Decimal | number) {
  const value = amount instanceof Decimal ? amount.toNumber() : amount;
  return `₱${value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

export function formatStatus(status: string | null) {
  if (!status) return "—";
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export const formatUnit = (value: number, unit: string) => {
  const lower = unit?.toLowerCase();
  const displayUnit = value === 1 && lower === "pcs" ? "pc" : lower;
  return `${value.toLocaleString()} ${displayUnit}`;
};

// Shared badge colors so every status badge looks the same in light and dark mode
export const badgeTones = {
  success:
    "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
  warning:
    "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400",
  caution:
    "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400",
  danger: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
  neutral: "bg-muted text-muted-foreground",
};

export const inventoryStatusConfig = {
  in_stock: { label: "In Stock", className: badgeTones.success },
  low_stock: { label: "Low Stock", className: badgeTones.warning },
  warning: { label: "Warning", className: badgeTones.caution },
  out_of_stock: { label: "Out of Stock", className: badgeTones.danger },
  discontinued: { label: "Discontinued", className: badgeTones.neutral },
};

export const purchaseStatusConfig: Record<
  PurchaseStatus,
  { label: string; className: string }
> = {
  DRAFT: { label: "Draft", className: badgeTones.neutral },
  RECEIVED: { label: "Received", className: badgeTones.success },
  CANCELLED: { label: "Cancelled", className: badgeTones.danger },
};

//date helper
export function formatDate(date?: Date | null) {
  if (!date) return "";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export const today = new Date().toLocaleDateString("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});
