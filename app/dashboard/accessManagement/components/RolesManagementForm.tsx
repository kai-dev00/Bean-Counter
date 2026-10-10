"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import CustomButton from "@/components/CustomButton";
import { CustomInput } from "@/components/CustomInput";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { createRoleAction, updateRoleAction } from "../actions/roles";
import Link from "next/link";
import { PermissionTable } from "./PermissionTable";
import { showToast } from "@/lib/toast";
import { PageCard } from "@/components/PageCard";

const roleSchema = z.object({
  name: z.string().min(1, "Role name is required"),
  description: z.string(),
  permissionIds: z.array(z.string()),
});
type RoleFormValues = z.infer<typeof roleSchema>;

type Permission = {
  id: string;
  action: string;
  module: string;
  submodule: string;
  description: string;
};

type Role = {
  id: string;
  name: string;
  description: string | null;
  permissions: Permission[];
};

type Props = {
  role?: Role;
  permissions: Permission[];
};

export function RoleForm({ role, permissions }: Props) {
  const router = useRouter();
  const isEdit = !!role;
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: role?.name || "",
      description: role?.description || "",
      permissionIds: role?.permissions.map((p) => p.id) || [],
    },
  });

  const selectedPermissions = watch("permissionIds");

  async function onSubmit(data: RoleFormValues) {
    try {
      if (isEdit) {
        await updateRoleAction(role!.id, data);
        showToast.success(
          "Role updated",
          "The role has been successfully updated. Please relogin to apply changes.",
        );
      } else {
        await createRoleAction(data);
        showToast.success(
          "Role created",
          "The role has been successfully created.",
        );
      }
      router.push("/dashboard/accessManagement/roles");
      router.refresh();
    } catch (err: any) {
      showToast.error(
        "Something went wrong",
        err?.message ?? "Please try again",
      );
      console.error(err);
    }
  }

  function togglePermission(id: string) {
    setValue(
      "permissionIds",
      selectedPermissions.includes(id)
        ? selectedPermissions.filter((p) => p !== id)
        : [...selectedPermissions, id],
    );
  }

  function toggleMany(ids: string[], checked: boolean) {
    setValue(
      "permissionIds",
      checked
        ? Array.from(new Set([...selectedPermissions, ...ids]))
        : selectedPermissions.filter((id) => !ids.includes(id)),
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <PageCard title="Role Details">
        <CustomInput
          label="Role Name"
          placeholder="e.g., MANAGER"
          error={errors.name?.message}
          {...register("name")}
        />

        <CustomInput
          label="Description"
          multiline={true}
          error={errors.description?.message}
          {...register("description")}
        />
      </PageCard>

      <PageCard title="Permissions">
        <div className="overflow-x-auto">
          <PermissionTable
            permissions={permissions}
            selectedIds={selectedPermissions}
            onToggle={togglePermission}
            onToggleMany={toggleMany}
          />
        </div>
      </PageCard>

      <div className="flex gap-3">
        <Link href="/dashboard/accessManagement/roles" className="flex-1">
          <CustomButton
            type="button"
            variant="outline"
            disabled={isSubmitting}
            className="w-full"
          >
            Cancel
          </CustomButton>
        </Link>
        <CustomButton type="submit" disabled={isSubmitting} className="flex-1">
          {isEdit ? "Update Role" : "Create Role"}
        </CustomButton>
      </div>
    </form>
  );
}
