"use client";

import { unwrap } from "@/lib/unwrap-action";
import { Category } from "@/app/generated/prisma/browser";
import { DataTable, Column } from "@/components/DataTable";
import CustomButton from "@/components/CustomButton";
import { Download, Eye, Pencil, Trash2 } from "lucide-react";
import { deleteCategory } from "../actions";
import { useRouter } from "next/navigation";
import { showToast } from "@/lib/toast";
import { CustomModal } from "@/components/CustomModal";
import { useState } from "react";
import { Permission } from "@/lib/types";
import NoPermission from "../../no-permission";
import { usePermission } from "@/lib/permissions/usePermission";
import { formatDate, formatPeso, today } from "../../utils";
import { CategoryViewModal } from "./categoryViewModal";
import { TruncatedCell } from "../../utils/descriptionHelper";
import { CustomTooltip } from "@/components/CustomTooltip";
import { downloadExcel } from "../../utils/downloadExcel";

type Props = {
  categories: Category[];
  onEdit: (category: Category) => void;
  permissions: Permission[];
  headerActions?: React.ReactNode;
  defaultSearch?: string;
};

export default function CategoryTable({
  categories,
  onEdit,
  permissions,
  headerActions,
  defaultSearch,
}: Props) {
  const { can } = usePermission(permissions);
  if (!can("category:read")) return <NoPermission />;
  const [viewCategory, setViewCategory] = useState<Category | null>(null);
  const [deleteUser, setDeleteUser] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();
  const handleDelete = async () => {
    if (!deleteUser) return;
    setDeleting(true);
    try {
      await unwrap(deleteCategory(deleteUser.id));
      showToast.success("Category deleted", "The category has been removed");
      router.refresh();
      setDeleteUser(null);
    } catch (err) {
      showToast.error("Delete failed", (err as Error).message);
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<Category>[] = [
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
      key: "description",
      header: "Description",
      className: "max-w-[150px]",
      cell: (row) => {
        if (!row.description) return <span>N/A</span>;
        return <TruncatedCell text={row.description} />;
      },
      exportValue: (row) => row.description,
    },

    {
      key: "totalPrice",
      numeric: true,
      header: "Total Price",
      cell: (row) => formatPeso(row.totalPrice),
      exportValue: (row) => formatPeso(row.totalPrice),
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
          {can("category:read") && (
            <CustomTooltip content="View">
              <CustomButton
                size="sm"
                variant="ghost"
                onClick={() => setViewCategory(row)}
              >
                <Eye className="h-4 w-4" />
              </CustomButton>
            </CustomTooltip>
          )}

          {can("category:update") && (
            <CustomTooltip content="Edit">
              <CustomButton size="sm" variant="ghost" onClick={() => onEdit(row)}>
                <Pencil className="h-4 w-4" />
              </CustomButton>
            </CustomTooltip>
          )}

          {can("category:delete") && (
            <CustomTooltip content="Delete">
              <CustomButton
                size="sm"
                variant="ghost"
                onClick={() => setDeleteUser(row)}
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
        data={categories}
        defaultSearch={defaultSearch}
        columns={columns}
        keyField="id"
        dateRangeKey="createdAt"
        headerActions={
          <div className="flex gap-2">
            {categories.length > 0 && (
              <CustomTooltip content="Download Excel">
                <CustomButton
                  variant="outline"
                  onClick={() =>
                    downloadExcel(categories, columns, `Categories-${today}`)
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
        title="Delete Category"
        description="This action cannot be undone. This will permanently delete the category and its inventory."
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
              Delete Category
            </CustomButton>
          </div>
        </div>
      </CustomModal>
      <CategoryViewModal
        open={!!viewCategory}
        onOpenChange={(v) => !v && setViewCategory(null)}
        category={viewCategory}
      />
    </>
  );
}
