"use client";

import { DataTable, Column } from "@/components/DataTable";
import CustomButton from "@/components/CustomButton";
import { Pencil, Trash2, Eye, Download } from "lucide-react";
import { useRouter } from "next/navigation";
import { showToast } from "@/lib/toast";
import { CustomModal } from "@/components/CustomModal";
import { useState } from "react";
import { Permission } from "@/lib/types";
import NoPermission from "../../no-permission";
import { usePermission } from "@/lib/permissions/usePermission";
import { Supplier } from "@/app/generated/prisma/browser";
import { CustomTooltip } from "@/components/CustomTooltip";
import { TruncatedCell } from "../../utils/descriptionHelper";
import { deleteSupplier } from "../actions";
import { SupplierViewModal } from "./SupplierViewModal";
import { formatDate, today } from "../../utils";
import { downloadExcel } from "../../utils/downloadExcel";

type Props = {
  suppliers: Supplier[];

  onEdit: (supplier: Supplier) => void;
  permissions: Permission[];
  headerActions?: React.ReactNode;
  defaultSearch?: string;
};

export default function SupplierTable({
  suppliers,
  onEdit,
  permissions,
  headerActions,
  defaultSearch,
}: Props) {
  const { can } = usePermission(permissions);
  if (!can("supplier:read")) return <NoPermission />;
  const [viewSupplier, setViewSupplier] = useState<Supplier | null>(null);
  const [deleteUser, setDeleteUser] = useState<Supplier | null>(null);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();
  const handleDelete = async () => {
    if (!deleteUser) return;
    setDeleting(true);
    try {
      await deleteSupplier(deleteUser.id);
      showToast.success("Supplier deleted", "The supplier has been removed");
      router.refresh();
      setDeleteUser(null);
    } catch (err) {
      showToast.error("Delete failed", "Unable to delete supplier");
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<Supplier>[] = [
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
      key: "address",
      header: "Address",
      cell: (row) => {
        if (!row.address) return <span>N/A</span>;
        return <TruncatedCell text={row.address} />;
      },
      exportValue: (row) => row.address,
    },
    {
      key: "email",
      header: "Email",
      className: "max-w-[150px]",
      cell: (row) => row.email,
      exportValue: (row) => row.email,
    },
    {
      key: "phone",
      header: "Phone",
      cell: (row) => row.phone,
      exportValue: (row) => row.phone,
    },
    {
      key: "notes",
      header: "Notes",
      cell: (row) => {
        if (!row.notes) return <span>N/A</span>;
        return <TruncatedCell text={row.notes} />;
      },
      exportValue: (row) => row.notes,
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
          {can("supplier:read") && (
            <CustomTooltip content="View">
              <CustomButton
                size="sm"
                variant="ghost"
                onClick={() => setViewSupplier(row)}
              >
                <Eye className="h-4 w-4" />
              </CustomButton>
            </CustomTooltip>
          )}
          {can("supplier:update") && (
            <CustomTooltip content="Edit">
              <CustomButton size="sm" variant="ghost" onClick={() => onEdit(row)}>
                <Pencil className="h-4 w-4" />
              </CustomButton>
            </CustomTooltip>
          )}
          {can("supplier:delete") && (
            <CustomTooltip content="Delete">
              <CustomButton
                size="sm"
                variant="ghost"
                onClick={() => setDeleteUser(row)}
              >
                <Trash2 className="h-4 w-4 " />
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
        data={suppliers}
        defaultSearch={defaultSearch}
        columns={columns}
        keyField="id"
        dateRangeKey="createdAt"
        headerActions={
          <div className="flex gap-2">
            {suppliers.length > 0 && (
              <CustomTooltip content="Download Excel">
                <CustomButton
                  variant="outline"
                  onClick={() =>
                    downloadExcel(suppliers, columns, `Suppliers-${today}`)
                  }
                >
                  <Download className="size-4" />
                </CustomButton>
              </CustomTooltip>
            )}
            {headerActions}
          </div>
        }
      />
      <CustomModal
        open={!!deleteUser}
        onOpenChange={(v) => !v && setDeleteUser(null)}
        title="Delete Supplier"
      >
        <div className="space-y-4">
          <p className="text-sm">
            Are you sure you want to delete{" "}
            <span className="font-semibold">{deleteUser?.name}</span>?
          </p>

          <div className="flex justify-end gap-2">
            <CustomButton variant="outline" onClick={() => setDeleteUser(null)}>
              Cancel
            </CustomButton>

            <CustomButton
              variant="destructive"
              disabled={deleting}
              loading={deleting}
              onClick={handleDelete}
            >
              Delete Supplier
            </CustomButton>
          </div>
        </div>
      </CustomModal>

      <SupplierViewModal
        open={!!viewSupplier}
        onOpenChange={(v) => !v && setViewSupplier(null)}
        supplier={viewSupplier}
      />
    </>
  );
}
