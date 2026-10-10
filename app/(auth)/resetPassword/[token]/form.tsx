"use client";

import { resetPasswordAction } from "@/app/actions/auth.reset-password";
import { CustomInput } from "@/components/CustomInput";
import CustomButton from "@/components/CustomButton";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import z from "zod";

const resetPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type ResetFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetFormValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  async function onSubmit(data: ResetFormValues) {
    await resetPasswordAction({ token, password: data.password });
    router.push("/login");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-md space-y-5 rounded-xl border bg-card p-6 shadow-sm"
      >
        <h1 className="text-xl font-semibold mb-4">Reset Password</h1>

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
