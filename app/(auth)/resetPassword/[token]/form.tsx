"use client";

import { resetPasswordAction } from "@/app/actions/auth.reset-password";
import { CustomInput } from "@/components/CustomInput";
import CustomButton from "@/components/CustomButton";
import { BrandLockup } from "@/components/BrandMark";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useState } from "react";
import {
  ResetPasswordFormValues as ResetFormValues,
  resetPasswordSchema,
} from "@/lib/validation/auth";

export default function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetFormValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  async function onSubmit(data: ResetFormValues) {
    setServerError(null);
    const result = await resetPasswordAction({ token, password: data.password });
    if (!result.success) {
      setServerError(result.error);
      return;
    }
    router.push("/login");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-md space-y-5 rounded-xl border bg-card p-6 shadow-sm"
      >
        <BrandLockup />
        <h1 className="text-xl font-semibold mb-4">Reset Password</h1>
        {serverError && (
          <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {serverError}
          </div>
        )}

        <CustomInput
          label="New Password"
          type="password"
          error={errors.password?.message}
          {...register("password")}
        />

        <CustomButton
          type="submit"
          className="w-full"
          disabled={isSubmitting}
          loading={isSubmitting}
        >
          Reset Password
        </CustomButton>
      </form>
    </main>
  );
}
