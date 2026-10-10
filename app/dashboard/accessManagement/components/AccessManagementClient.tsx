"use client";

import { useState } from "react";
import { PageCard } from "@/components/PageCard";
import { DataTable, Column } from "@/components/DataTable";
import CustomButton from "@/components/CustomButton";
import { CustomModal } from "@/components/CustomModal";
import AccessManagementForm from "./AccessManagementForm";
import { useRouter } from "next/navigation";
import { showToast } from "@/lib/toast";
import { RoleOption, UserRow } from "../users/page";
import { Pencil, Trash2 } from "lucide-react";
import NoPermission from "../../no-permission";
import { Permission } from "@/lib/types";
import { usePermission } from "@/lib/permissions/usePermission";
import { deleteAccessAction } from "../actions/users";
import { CustomTooltip } from "@/components/CustomTooltip";
import { Badge } from "@/components/ui/badge";
import { badgeTones } from "../../utils";

type EditUserData = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  roleId?: string;
  isActive?: boolean;
  emailVerified?: boolean;
};
export default function AccessManagementClient({
  users,
  roles,
  permissions,
  defaultSearch,
}: {
  users: UserRow[];
  roles: RoleOption[];
  permissions: Permission[];
  defaultSearch?: string;
}) {
  const { can } = usePermission(permissions);
  if (!can("access-management:read:users")) return <NoPermission />;
  console.log(users);
  const [open, setOpen] = useState(false);
  const [editUser, setEditUser] = useState<EditUserData | undefined>(undefined);
  const [deleteUser, setDeleteUser] = useState<UserRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  const handleEdit = (user: UserRow) => {
    const role = roles.find((r) => r.name === user.role);
    setEditUser({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roleId: role?.id,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
    });
    setOpen(true);
  };

  const handleAddNew = () => {
    setEditUser(undefined);
    setOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteUser) return;
    setDeleting(true);
    try {
      await deleteAccessAction(deleteUser.id, deleteUser.source);
      showToast.success("User deleted", "The user has been removed");
      router.refresh();
      setDeleteUser(null);
    } catch (err: unknown) {
      let message = "Unable to delete user";
      if (err instanceof Error) {
        message = err.message;
      }
      showToast.error("Delete failed", message);
      console.error(err);
      setDeleteUser(null);
    } finally {
      setDeleting(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    // Clear edit user after modal closes
    setTimeout(() => setEditUser(undefined), 200);
  };
  const columns: Column<UserRow>[] = [
    { key: "email", header: "Email" },
    {
      key: "fullName",
      header: "Name",
      cell: (row) => row.fullName ?? "—",
    },
    { key: "role", header: "Role" },
    {
      key: "isActive",
      header: "Status",
      cell: (row) => (
        <Badge
          className={row.isActive ? badgeTones.success : badgeTones.neutral}
        >
          {row.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "emailVerified",
      header: "Verified",
      cell: (row) => (
        <span
          className={`text-xs ${
            row.emailVerified
              ? "text-green-600 dark:text-green-400"
              : "text-red-600 dark:text-red-400"
          }`}
        >
          {row.emailVerified ? "Yes" : "No"}
        </span>
      ),
    },
    // { key: "createdAt", header: "Created At" },
    // { key: "createdBy", header: "Created By" },
    // { key: "updatedBy", header: "Updated By" },
    // { key: "updatedAt", header: "Updated At" },

    {
      key: "actions",
      header: "",
      className: "text-right",
      cell: (row) => (
        <div className="flex justify-center">
          {can("access-management:update:users") && (
            <CustomTooltip content="Edit">
              <CustomButton size="sm" variant="ghost" onClick={() => handleEdit(row)}>
                <Pencil className="h-4 w-4" />
              </CustomButton>
            </CustomTooltip>
          )}
          {can("access-management:delete:users") && (
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
    <PageCard>
      <DataTable
        data={users}
        defaultSearch={defaultSearch}
        columns={columns}
        keyField="id"
        filters={[
          {
            // rows store the role name, so filter on names
            key: "role",
            label: "Role",
            options: roles.map((role) => ({
              label: role.name,
              value: role.name,
            })),
          },
        ]}
        headerActions={
          can("access-management:create:users") && (
            <CustomButton onClick={handleAddNew}>Add User</CustomButton>
          )
        }
      />
      <CustomModal
        open={open}
        onOpenChange={setOpen}
        title={editUser ? "Edit User" : "Add User"}
        description={
          editUser
            ? "Update user information and role"
            : "Invite a user and assign a role"
        }
      >
        <AccessManagementForm
          key={editUser?.id || "new"}
          roles={roles}
          onSuccess={handleClose}
          editUser={editUser}
        />
      </CustomModal>
      <CustomModal
        open={!!deleteUser}
        onOpenChange={(v) => !v && setDeleteUser(null)}
        title="Delete User"
      >
        <div className="space-y-4">
          <p className="text-sm">
            Are you sure you want to delete{" "}
            <span className="font-semibold">{deleteUser?.email}</span>?
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
              {deleteUser?.source === "INVITE"
                ? "Delete Invite"
                : "Delete User"}
            </CustomButton>
          </div>
        </div>
      </CustomModal>
    </PageCard>
  );
}
