"use client";

import { useForm } from "react-hook-form";
import { loginAction } from "@/app/actions/auth.login";
import { JSX, useState } from "react";
import { CustomInput } from "@/components/CustomInput";
import CustomButton from "@/components/CustomButton";
import Link from "next/link";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginForm(): JSX.Element {
  const [serverError, setServerError] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);
    try {
      const result = await loginAction(values);
      if (result?.success) {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setServerError(err.message || "Login failed");
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-md space-y-5 rounded-xl border bg-card p-6 shadow-sm"
      >
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome to Bean Counter!
          </h1>
          <p className="text-sm text-muted-foreground">
            Log in to your account
          </p>
        </div>

        {serverError && (
          <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {serverError}
          </div>
        )}
        <CustomInput
          label="Email"
          type="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register("email")}
        />
        <CustomInput
          label="Password"
          type="password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register("password")}
        />
        <CustomButton
          type="submit"
          disabled={isSubmitting}
          loading={isSubmitting}
          className="w-full"
        >
          Login
        </CustomButton>
        <div className="text-center text-sm text-muted-foreground">
          <Link href="/forgotPassword" className="hover:underline">
            Forgot Password?
          </Link>
        </div>
      </form>
    </main>
  );
}
