"use client";

import Link from "next/link";
import { PageCard } from "@/components/PageCard";
import { Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import CustomButton from "@/components/CustomButton";
import { DataTable, Column } from "@/components/DataTable";
import { CustomModal } from "@/components/CustomModal";
import { deleteRoleAction } from "../actions/roles";
import { showToast } from "@/lib/toast";
import NoPermission from "../../no-permission";
import { usePermission } from "@/lib/permissions/usePermission";
import { Permission } from "@/lib/types";
import { CustomTooltip } from "@/components/CustomTooltip";

type Role = {
  id: string;
  name: string;
  description: string | null;
  permissions: { id: string; action: string; module: string }[];
  _count: { users: number };
};

type Props = {
  roles: Role[];
  permissions: Permission[];
  defaultSearch?: string;
};

export function RolesManagementClient({
  roles,
  permissions,
  defaultSearch,
}: Props) {
  const { can } = usePermission(permissions);
  if (!can("access-management:read:roles")) return <NoPermission />;

  const router = useRouter();
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    role: Role | null;
  }>({ open: false, role: null });
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!deleteModal.role) return;
    try {
      setIsDeleting(true);
      await deleteRoleAction(deleteModal.role.id);
      showToast.success(
        "Role deleted",
        "The role has been successfully deleted.",
      );
      setDeleteModal({ open: false, role: null });
      router.refresh();
    } catch (err: any) {
      showToast.error(
        "Something went wrong",
        err?.message ?? "Please try again",
      );
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  }

  const columns: Column<Role>[] = [
    {
      key: "name",
      header: "Role Name",
      cell: (role) => <span className="font-medium">{role.name}</span>,
    },
    {
      key: "description",
      header: "Description",
      cell: (role) => (
        <span className="text-muted-foreground">{role.description || "-"}</span>
      ),
    },
    {
      key: "permissions",
      header: "Permissions",
      cell: (role) => `${role.permissions.length} permissions`,
    },
    {
      key: "_count",
      header: "Users",
      cell: (role) => `${role._count.users} users`,
    },
    {
      key: "actions",
      header: "",
      className: "text-end",
      cell: (role) => (
        <div className="flex justify-center">
          {can("access-management:update:roles") && (
            <CustomTooltip content="Edit">
              <Link href={`/dashboard/accessManagement/roles/${role.id}/edit`}>
                <CustomButton variant="ghost" size="sm">
                  <Pencil className="h-4 w-4" />
                </CustomButton>
              </Link>
            </CustomTooltip>
          )}
          {can("access-management:delete:roles") && (
            <CustomTooltip content="Delete">
              <CustomButton
                variant="ghost"
                size="sm"
                onClick={() => setDeleteModal({ open: true, role })}
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
    <PageCard>
      <DataTable<Role>
        data={roles}
        defaultSearch={defaultSearch}
        columns={columns}
        keyField="id"
        headerActions={
          can("access-management:create:roles") && (
            <Link href="roles/add">
              <CustomButton>Add Role</CustomButton>
            </Link>
          )
        }
      />

      <CustomModal
        open={deleteModal.open}
        onOpenChange={(open) =>
          !isDeleting && setDeleteModal({ open, role: null })
        }
        title="Delete Role"
        description={`Are you sure you want to delete the role "${deleteModal.role?.name}"? This action cannot be undone.`}
        showCloseButton={!isDeleting}
        footer={
          <div className="flex gap-2 w-full">
            <CustomButton
              variant="outline"
              onClick={() => setDeleteModal({ open: false, role: null })}
              disabled={isDeleting}
              className="flex-1"
            >
              Cancel
            </CustomButton>
            <CustomButton
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              loading={isDeleting}
              className="flex-1"
            >
              Delete
            </CustomButton>
          </div>
        }
      >
        {deleteModal.role && deleteModal.role._count.users > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              Warning: This role has {deleteModal.role._count.users} user(s)
              assigned. Deletion will fail unless users are reassigned first.
            </p>
          </div>
        )}
      </CustomModal>
    </PageCard>
  );
}
