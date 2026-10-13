"use client";

import { forgotPasswordAction } from "@/app/actions/auth.forgot-password";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { CustomInput } from "@/components/CustomInput";
import CustomButton from "@/components/CustomButton";
import Link from "next/link";
import { BrandLockup } from "@/components/BrandMark";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ForgotPasswordFormValues,
  forgotPasswordSchema,
} from "@/lib/validation/auth";

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(data: ForgotPasswordFormValues) {
    setServerError(null);
    const result = await forgotPasswordAction(data);
    if (!result.success) {
      setServerError(result.error);
      return;
    }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md space-y-5 rounded-xl border bg-card p-6 shadow-sm">
          <BrandLockup />
          <h1 className="text-xl font-semibold">Reset link has been sent</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Please check your email to proceed.
          </p>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <Link href="/login" className="hover:underline">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-md space-y-5 rounded-xl border bg-card p-6 shadow-sm"
      >
        <BrandLockup />
        <h1 className="text-xl font-semibold mb-4">Forgot Password</h1>
        {serverError && (
          <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {serverError}
          </div>
        )}
        <CustomInput
          label="Email"
          type="email"
          placeholder="Email address"
          autoComplete="email"
          error={errors.email?.message}
          {...register("email")}
        />
        <CustomButton
          type="submit"
          disabled={isSubmitting}
          loading={isSubmitting}
          className="w-full"
        >
          Send reset link
        </CustomButton>
        <div className="text-center text-sm text-muted-foreground">
          <Link href="/login" className="hover:underline">
            Back to Login
          </Link>
        </div>
      </form>
    </main>
  );
}
