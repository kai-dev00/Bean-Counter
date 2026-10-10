"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import CustomButton from "@/components/CustomButton";
import { CustomInput } from "@/components/CustomInput";
import { useRouter } from "next/navigation";
import { registerUserAction } from "@/app/actions/auth.register";
import { useState } from "react";
import { showToast } from "@/lib/toast";
import { CustomModal } from "@/components/CustomModal";

const registerSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    phoneNumber: z
      .string()
      .min(1, "Phone number is required")
      .regex(/^\+?[0-9]{10,15}$/, "Invalid phone number format"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

type Props = {
  token: string;
  inviteData: {
    email: string;
    firstName: string;
    lastName: string;
    roleName: string;
  };
};

export default function RegisterForm({ token, inviteData }: Props) {
  const router = useRouter();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  async function onSubmit(data: RegisterFormValues) {
    // await registerUserAction({
    //   token,
    //   password: data.password,
    //   phoneNumber: data.phoneNumber,
    // });
    // router.push("/login");

    try {
      await registerUserAction({
        token,
        password: data.password,
        phoneNumber: data.phoneNumber,
      });
      setShowSuccessModal(true);
    } catch (error: any) {
      showToast.error(
        "Something went wrong",
        error?.message ?? "Please try again",
      );
    }
  }

  return (
    <>
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="w-full max-w-md space-y-5 rounded-xl border bg-card p-6 shadow-sm"
        >
          <h1 className="text-xl font-semibold mb-4">
            Complete Your Registration
          </h1>

          {/* Prefilled, disabled inputs */}
          <CustomInput label="Email" value={inviteData.email} disabled />
          <CustomInput
            label="First Name"
            value={inviteData.firstName}
            disabled
          />
          <CustomInput label="Last Name" value={inviteData.lastName} disabled />
          <CustomInput label="Role" value={inviteData.roleName} disabled />

          {/* Password inputs */}

          <CustomInput
            label="Phone Number"
            type="tel"
            placeholder="+1234567890"
            required
            error={errors.phoneNumber?.message}
            {...register("phoneNumber")}
          />
          <CustomInput
            label="Password"
            type="password"
            required
            error={errors.password?.message}
            {...register("password")}
          />
          <CustomInput
            label="Confirm Password"
            type="password"
            required
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />

          <CustomButton
            type="submit"
            className="w-full"
            disabled={isSubmitting}
            loading={isSubmitting}
          >
            Register
          </CustomButton>
        </form>
      </main>

      <CustomModal
        open={showSuccessModal}
        onOpenChange={setShowSuccessModal}
        title="Registration Successful! 🎉"
        description="Your account has been created successfully. You can now log in with your credentials."
        showCloseButton={false}
        footer={
          <CustomButton onClick={() => router.push("/login")} className="w-full">
            Go to Login
          </CustomButton>
        }
      >
        <div className="text-center py-4">
          <div className="text-6xl mb-4">✓</div>
          <p className="text-sm text-muted-foreground">
            Welcome to Coffee Shop Inventory, {inviteData.firstName}!
          </p>
        </div>
      </CustomModal>
    </>
  );
}
