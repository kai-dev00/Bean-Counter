"use client";

import { DataTable, Column } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Eye, Download } from "lucide-react";
import { useRouter } from "next/navigation";
import { showToast } from "@/lib/toast";
import { CustomModal } from "@/components/CustomModal";
import { useState } from "react";
import { Permission } from "@/lib/types";
import NoPermission from "../../no-permission";
import { usePermission } from "@/lib/permissions/usePermission";
import { InventoryWithCategory, PurchaseHistoryItem } from "../InventoryClient";
import {
  formatDate,
  formatPeso,
  formatUnit,
  inventoryStatusConfig,
  today,
} from "../../utils";
import { deleteInventory } from "../actions";
import { InventoryStatusBadge } from "./inventoryStatusBadge";
import { InventoryViewModal } from "./inventoryViewModal";
import { Category, InventoryStatus } from "@/app/generated/prisma/browser";
import { CustomTooltip } from "@/components/CustomTooltip";
import { TruncatedCell } from "../../utils/descriptionHelper";
import { downloadExcel } from "../../utils/downloadExcel";

type Props = {
  inventories: InventoryWithCategory[];
  categories: Category[];
  onEdit: (inventory: InventoryWithCategory) => void;
  permissions: Permission[];
  headerActions?: React.ReactNode;
  defaultSearch?: string;
  purchaseHistory: PurchaseHistoryItem[];
};

export default function InventoryTable({
  inventories,
  categories,
  onEdit,
  permissions,
  headerActions,
  defaultSearch,
  purchaseHistory,
}: Props) {
  const { can } = usePermission(permissions);
  if (!can("category:read")) return <NoPermission />;
  const [viewInventory, setViewInventory] =
    useState<InventoryWithCategory | null>(null);
  const [deleteUser, setDeleteUser] = useState<InventoryWithCategory | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();
  const handleDelete = async () => {
    if (!deleteUser) return;
    setDeleting(true);
    try {
      await deleteInventory(deleteUser.id);
      showToast.success("Inventory deleted", "The inventory has been removed");
      router.refresh();
      setDeleteUser(null);
    } catch (err) {
      showToast.error("Delete failed", "Unable to delete inventory");
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<InventoryWithCategory>[] = [
    {
      key: "name",
      header: "Name",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <span>{row.name}</span>
        </div>
      ),
      exportValue: (row) => row.name,
    },
    {
      key: "category",
      header: "Category",
      cell: (row) => row.category?.name,
      exportValue: (row) => row.category?.name ?? "",
    },
    {
      key: "description",
      header: "Description",
      className: "max-w-[150px]",
      cell: (row) => {
        if (!row.description) return <span>N/A</span>;
        return <TruncatedCell text={row.description} />;
      },
      exportValue: (row) => `${row.quantity} ${row.unit.toLowerCase()}`,
    },
    {
      key: "quantity",
      header: "Quantity",
      cell: (row) => {
        return (
          <div className="flex items-center gap-2">
            <span>
              <span>{formatUnit(row.quantity, row.unit)}</span>
            </span>
          </div>
        );
      },
      exportValue: (row) => `${row.quantity} ${row.unit.toLowerCase()}`,
    },
    {
      key: "minimumStock",
      header: "Minimum Stock",
      cell: (row) => {
        if (row.minimumStock == null) return <span>N/A</span>;
        return (
          <div className="flex items-center gap-2">
            <span>
              <span>{formatUnit(row.minimumStock, row.unit)}</span>
            </span>
          </div>
        );
      },
      exportValue: (row) => {
        if (row.minimumStock == null) return "";
        return `${row.minimumStock} ${row.unit.toLowerCase()}`;
      },
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => {
        if (!row.status) return null;
        return <InventoryStatusBadge status={row.status} />;
      },
      exportValue: (row) => row.status ?? "",
    },
    // {
    //   key: "price",
    //   header: "Price",
    //   cell: (row) => formatPeso(row.unitPrice),
    // },

    {
      key: "unitPrice",
      header: "Unit Price",
      cell: (row) => {
        const unit = row.unit?.toLowerCase();
        return (
          <span>
            {formatPeso(row.unitPrice)} / {unit}
          </span>
        );
      },
      exportValue: (row) => formatPeso(row.unitPrice),
    },
    {
      key: "totalAmount",
      header: "Total Amount",
      cell: (row) => formatPeso(row.unitPrice * row.quantity),
      exportValue: (row) => formatPeso(row.unitPrice * row.quantity),
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
        <div className="flex justify-center">
          {can("inventory:read") && (
            <CustomTooltip content="View">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setViewInventory(row)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </CustomTooltip>
          )}
          {can("inventory:update") && (
            <CustomTooltip content="Edit">
              <Button size="sm" variant="ghost" onClick={() => onEdit(row)}>
                <Pencil className="h-4 w-4" />
              </Button>
            </CustomTooltip>
          )}
          {can("inventory:delete") && (
            <CustomTooltip content="Delete">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setDeleteUser(row)}
              >
                <Trash2 className="h-4 w-4 " />
              </Button>
            </CustomTooltip>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable
        data={inventories}
        defaultSearch={defaultSearch}
        columns={columns}
        keyField="id"
        headerActions={
          <div className="flex gap-2">
            {inventories.length > 0 && (
              <CustomTooltip content="Download Excel">
                <Button
                  variant="outline"
                  onClick={() =>
                    downloadExcel(inventories, columns, `Inventories-${today}`)
                  }
                >
                  <Download className="size-4" />
                </Button>
              </CustomTooltip>
            )}
            {headerActions}
          </div>
        }
        filters={[
          {
            key: "status",
            label: "Status",
            options: Object.values(InventoryStatus).map((status) => ({
              label: inventoryStatusConfig[status].label,
              value: status,
            })),
          },
          {
            key: "categoryId",
            label: "Category",
            options: categories.map((cat) => ({
              label: cat.name,
              value: cat.id,
            })),
          },
        ]}
        dateRangeKey="createdAt"
      />
      {/* <Button onClick={() => downloadExcel(inventories, columns, "inventory")}>
        Download Excel
      </Button> */}
      <CustomModal
        open={!!deleteUser}
        onOpenChange={(v) => !v && setDeleteUser(null)}
        title="Delete Inventory"
      >
        <div className="space-y-4">
          <p className="text-sm">
            Are you sure you want to delete{" "}
            <span className="font-semibold">{deleteUser?.name}</span>?
          </p>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteUser(null)}>
              Cancel
            </Button>

            <Button
              variant="destructive"
              disabled={deleting}
              loading={deleting}
              onClick={handleDelete}
            >
              Delete Inventory
            </Button>
          </div>
        </div>
      </CustomModal>

      <InventoryViewModal
        open={!!viewInventory}
        onOpenChange={(v) => !v && setViewInventory(null)}
        inventory={viewInventory}
        purchaseHistory={purchaseHistory}
      />
    </>
  );
}
