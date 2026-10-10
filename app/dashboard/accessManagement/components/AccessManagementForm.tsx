"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import CustomButton from "@/components/CustomButton";
import { Checkbox } from "@/components/ui/checkbox";
import CustomDropdown from "@/components/CustomDropdown";
import { CustomInput } from "@/components/CustomInput";
import { editUserAction, inviteUserAction } from "../actions/users";
import { useRouter } from "next/navigation";
import { showToast } from "@/lib/toast";
import { userFormSchema, UserFormValues } from "../schema";

type RoleOption = {
  id: string;
  name: string;
};

type UserData = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  roleId?: string;
  isActive?: boolean;
  emailVerified?: boolean;
};

export default function AccessManagementForm({
  roles,
  onSuccess,
  editUser,
}: {
  roles: RoleOption[];
  onSuccess: () => void;
  editUser?: UserData;
}) {
  const router = useRouter();
  const isEditMode = Boolean(editUser);

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      id: editUser?.id,
      email: editUser?.email || "",
      firstName: editUser?.firstName || "",
      lastName: editUser?.lastName || "",
      isActive: editUser?.isActive ?? true,
      roleId: editUser?.roleId || "",
    },
  });

  const {
    formState: { isDirty, isSubmitting },
  } = form;

  async function onSubmit(data: UserFormValues) {
    try {
      if (isEditMode && editUser) {
        await editUserAction({
          id: data.id!,
          // email: data.email,
          roleId: data.roleId,
          isActive: data.isActive,
        });
        showToast.success("User updated", "Changes were saved successfully");
      } else {
        await inviteUserAction({
          email: data.email,
          firstName: data.firstName!,
          lastName: data.lastName!,
          roleId: data.roleId,
          isActive: data.isActive,
        });
        showToast.success(
          "Invite sent",
          "The user will receive an email invitation",
        );
      }
      router.refresh();
      onSuccess();
    } catch (err: unknown) {
      const error = err as Error;
      showToast.error(
        "Something went wrong",
        error?.message ?? "Please try again",
      );
      console.error(err);
    }
  }

  const roleOptions = roles.map((r) => ({
    label: r.name,
    value: String(r.id), // UI = string
  }));

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {/* Email */}
      <CustomInput
        label="Email"
        required={!isEditMode}
        placeholder="Email"
        error={form.formState.errors.email?.message}
        {...form.register("email")}
        disabled={isEditMode}
      />

      {/* Names */}
      {!isEditMode && (
        <div className="grid grid-cols-2 gap-2">
          <CustomInput
            label="First Name"
            required
            placeholder="First name"
            error={form.formState.errors.firstName?.message}
            {...form.register("firstName")}
          />

          <CustomInput
            label="Last Name"
            required
            placeholder="Last name"
            error={form.formState.errors.lastName?.message}
            {...form.register("lastName")}
          />
        </div>
      )}

      {/* Role */}
      <CustomDropdown
        label="Role"
        required={!isEditMode}
        placeholder="Select role"
        options={roleOptions}
        value={form.watch("roleId")?.toString()}
        error={form.formState.errors.roleId?.message}
        onChange={(value) =>
          form.setValue("roleId", value, {
            shouldValidate: true,
            shouldDirty: true,
          })
        }
      />

      {/* Active */}
      <div className="flex items-center gap-2">
        <Checkbox
          checked={form.watch("isActive")}
          onCheckedChange={(v) =>
            form.setValue("isActive", Boolean(v), {
              shouldDirty: true,
              shouldValidate: true,
            })
          }
          disabled={isEditMode && !editUser?.emailVerified}
        />
        <span className="text-sm">Active</span>
      </div>

      <CustomButton
        type="submit"
        className="w-full"
        disabled={isSubmitting || (isEditMode && !isDirty)}
        loading={isSubmitting}
      >
        {/* Send Invite */}
        {isEditMode ? "Update User" : "Send Invite"}
      </CustomButton>
    </form>
  );
}
