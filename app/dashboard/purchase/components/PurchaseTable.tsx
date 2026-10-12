"use client";

import { unwrap } from "@/lib/unwrap-action";
import { DataTable, Column } from "@/components/DataTable";
import CustomButton from "@/components/CustomButton";
import {
  Pencil,
  Trash2,
  Eye,
  CheckCheck,
  XCircle,
  Download,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { showToast } from "@/lib/toast";
import { CustomModal } from "@/components/CustomModal";
import { useState } from "react";
import { Permission } from "@/lib/types";
import { usePermission } from "@/lib/permissions/usePermission";
import { formatDate, formatPeso, today } from "../../utils";
import { PurchaseStatus } from "@/app/generated/prisma/browser";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PurchaseWithDetails } from "./PurchaseClient";
import { cancelPurchase, deletePurchase, receivePurchase } from "../actions";
import { CustomTooltip } from "@/components/CustomTooltip";
import { PurchaseViewModal } from "./PurchaseViewModal";
import { downloadExcel } from "../../utils/downloadExcel";
import { purchaseStatusConfig } from "../../utils";

type Props = {
  purchases: PurchaseWithDetails[];
  onEdit: (purchase: PurchaseWithDetails) => void;
  permissions: Permission[];
  headerActions?: React.ReactNode;
};

export default function PurchaseTable({
  purchases,
  onEdit,
  permissions,
  headerActions,
}: Props) {
  const { can } = usePermission(permissions);
  const [viewPurchase, setViewPurchase] = useState<PurchaseWithDetails | null>(
    null,
  );
  const [deletePurchaseItem, setDeletePurchaseItem] =
    useState<PurchaseWithDetails | null>(null);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!deletePurchaseItem) return;
    setDeleting(true);
    try {
      await unwrap(deletePurchase(deletePurchaseItem.id));
      showToast.success("Purchase deleted");
      router.refresh();
      setDeletePurchaseItem(null);
    } catch (err) {
      showToast.error("Delete failed", (err as Error).message);
    } finally {
      setDeleting(false);
    }
  };

  //received, cancelled, draft

  const [receiving, setReceiving] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);

  const handleReceive = async (id: string) => {
    setReceiving(id);
    try {
      await unwrap(receivePurchase(id));
      showToast.success("Purchase received", "Inventory has been updated");
      router.refresh();
    } catch (err: any) {
      showToast.error("Failed", err?.message);
    } finally {
      setReceiving(null);
    }
  };

  const handleCancel = async (id: string) => {
    setCancelling(id);
    try {
      await unwrap(cancelPurchase(id));
      showToast.success("Purchase cancelled");
      router.refresh();
    } catch (err: any) {
      showToast.error("Failed", err?.message);
    } finally {
      setCancelling(null);
    }
  };

  const columns: Column<PurchaseWithDetails>[] = [
    {
      key: "id",
      header: "PO #",
      cell: (row) => (
        <span className="font-mono text-xs">
          {row.id.slice(0, 8).toUpperCase()}
        </span>
      ),
      exportValue: (row) => row.id.slice(0, 8).toUpperCase(),
    },
    {
      key: "supplier",
      header: "Supplier",
      cell: (row) => row.supplier?.name ?? "NA",
      exportValue: (row) => row.supplier?.name ?? "NA",
    },
    {
      key: "items",
      header: "Items",
      cell: (row) => (
        <span className="text-muted-foreground text-xs">
          {row.items.length} item{row.items.length !== 1 ? "s" : ""}
        </span>
      ),
      exportValue: (row) => row.items.length,
    },
    {
      key: "total",
      numeric: true,
      header: "Total",
      cell: (row) => formatPeso(row.total),
      exportValue: (row) => formatPeso(row.total),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => {
        const config = purchaseStatusConfig[row.status];
        return <Badge className={cn(config.className)}>{config.label}</Badge>;
      },
      exportValue: (row) => purchaseStatusConfig[row.status].label,
    },
    {
      key: "createdAt",
      header: "Created At",
      cell: (row) => formatDate(row.createdAt),
      exportValue: (row) => formatDate(row.createdAt),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      cell: (row) => (
        <div className="flex justify-center gap-1">
          {can("purchase:update") && row.status === "DRAFT" && (
            <>
              <CustomTooltip content="Mark as Received">
                <CustomButton
                  size="sm"
                  variant="ghost"
                  className="text-green-600 hover:text-green-700"
                  disabled={receiving === row.id}
                  onClick={() => handleReceive(row.id)}
                >
                  <CheckCheck className="h-4 w-4" />
                </CustomButton>
              </CustomTooltip>
              <CustomTooltip content="Cancel">
                <CustomButton
                  size="sm"
                  variant="ghost"
                  className="text-yellow-600 hover:text-yellow-700"
                  disabled={cancelling === row.id}
                  onClick={() => handleCancel(row.id)}
                >
                  <XCircle className="h-4 w-4" />
                </CustomButton>
              </CustomTooltip>
              <CustomTooltip content="Edit">
                <CustomButton size="sm" variant="ghost" onClick={() => onEdit(row)}>
                  <Pencil className="h-4 w-4" />
                </CustomButton>
              </CustomTooltip>
            </>
          )}
          {can("purchase:read") && (
            <CustomTooltip content="View">
              <CustomButton
                size="sm"
                variant="ghost"
                onClick={() => setViewPurchase(row)}
              >
                <Eye className="h-4 w-4" />
              </CustomButton>
            </CustomTooltip>
          )}

          {can("purchase:delete") && row.status === "DRAFT" && (
            <CustomTooltip content="Delete">
              <CustomButton
                size="sm"
                variant="ghost"
                onClick={() => setDeletePurchaseItem(row)}
              >
                <Trash2 className="h-4 w-4" />
              </CustomButton>
            </CustomTooltip>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable
        data={purchases}
        columns={columns}
        keyField="id"
        dateRangeKey="createdAt"
        headerActions={
          <div className="flex gap-2">
            {purchases.length > 0 && (
              <CustomTooltip content="Download Excel">
                <CustomButton
                  variant="outline"
                  onClick={() =>
                    downloadExcel(purchases, columns, `Purchases-${today}`)
                  }
                >
                  <Download className="size-4" />
                </CustomButton>
              </CustomTooltip>
            )}
            {headerActions}
          </div>
        }
        filters={[
          {
            key: "status",
            label: "Status",
            options: Object.values(PurchaseStatus).map((status) => ({
              label: purchaseStatusConfig[status].label,
              value: status,
            })),
          },
        ]}
      />

      {/* Delete Modal */}
      <CustomModal
        open={!!deletePurchaseItem}
        onOpenChange={(v) => !v && setDeletePurchaseItem(null)}
        title="Delete Purchase"
      >
        <div className="space-y-4">
          <p className="text-sm">
            Are you sure you want to delete purchase{" "}
            <span className="font-semibold">
              {deletePurchaseItem?.id.slice(0, 8).toUpperCase()}
            </span>
            ?
          </p>
          <div className="flex justify-end gap-2">
            <CustomButton
              variant="outline"
              onClick={() => setDeletePurchaseItem(null)}
            >
              Cancel
            </CustomButton>
            <CustomButton
              variant="destructive"
              disabled={deleting}
              loading={deleting}
              onClick={handleDelete}
            >
              Delete
            </CustomButton>
          </div>
        </div>
      </CustomModal>

      <PurchaseViewModal
        open={!!viewPurchase}
        onOpenChange={(v) => !v && setViewPurchase(null)}
        purchase={viewPurchase}
      />
    </>
  );
}
