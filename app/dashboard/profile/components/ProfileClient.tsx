"use client";

import { useForm } from "react-hook-form";
import { changePasswordAction } from "@/app/actions/auth.change-password";
import { useState } from "react";
import { CustomInput } from "@/components/CustomInput";
import CustomButton from "@/components/CustomButton";
import { showToast } from "@/lib/toast";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ChangePasswordFormValues as ChangePasswordForm,
  changePasswordSchema,
} from "@/lib/validation/auth";

export type UserProps = {
  id: string;
  fullName?: string | null;
  email?: string | null;
  role?: string | null;
  phoneNumber?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type Props = {
  user: UserProps;
};

export default function ProfileClient({ user }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
    },
  });

  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(data: ChangePasswordForm) {
    setError(null);
    setSuccess(false);

    try {
      const result = await changePasswordAction(data);
      if (!result.success) {
        showToast.error("Something went wrong", result.error);
        setError(result.error);
        return;
      }
      setSuccess(true);
      showToast.success(
        "Password updated",
        "Your password has been updated successfully.",
      );
      reset();
    } catch {
      showToast.error("Something went wrong", "Failed to update password.");
      setError("Something went wrong");
    }
  }

  return (
    <div className="max-w-lg space-y-6">
      {/* Profile info */}
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
            {user.fullName?.[0] ?? "U"}
          </div>

          <div>
            <p className="text-lg font-medium">
              {user.fullName ?? "Unnamed User"}
            </p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InfoRow label="Role" value={user.role ?? "Unknown"} />
          <InfoRow
            label="Joined"
            value={
              user.createdAt
                ? new Date(user.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : null
            }
          />
          <InfoRow label="Phone Number" value={user.phoneNumber ?? ""} />
          <InfoRow
            label="Last Updated"
            value={
              user.updatedAt
                ? new Date(user.updatedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : null
            }
          />
        </div>
      </div>

      {/* Change password */}
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <h2 className="mb-4 font-medium">Change Password</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <CustomInput
            label="Current Password"
            type="password"
            autoComplete="current-password"
            required
            error={errors.currentPassword?.message}
            {...register("currentPassword")}
          />

          <CustomInput
            label="New Password"
            type="password"
            autoComplete="new-password"
            required
            error={errors.newPassword?.message}
            {...register("newPassword")}
          />

          <CustomButton type="submit" loading={isSubmitting}>
            {isSubmitting ? "Updating..." : "Update"}
          </CustomButton>
        </form>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string | null;
  value: string | null;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}
