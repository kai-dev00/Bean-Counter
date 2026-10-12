import { z } from "zod";

// One password policy for register, reset and change password.
// Max 72 because bcrypt ignores anything past 72 bytes
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters");

const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required")
  .email("Invalid email address");

// Login doesn't apply the password policy, so accounts created under the
// old 6-character rule can still sign in
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});
export type LoginFormValues = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

const phoneNumberSchema = z
  .string()
  .min(1, "Phone number is required")
  .regex(/^\+?[0-9]{10,15}$/, "Invalid phone number format");

// Form version, with the confirm field
export const registerSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
    phoneNumber: phoneNumberSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type RegisterFormValues = z.infer<typeof registerSchema>;

// What the server action receives
export const registerInputSchema = z.object({
  token: z.string().min(1),
  password: passwordSchema,
  phoneNumber: phoneNumberSchema,
});
export type RegisterInput = z.infer<typeof registerInputSchema>;

export const resetPasswordSchema = z.object({
  password: passwordSchema,
});
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export const resetPasswordInputSchema = resetPasswordSchema.extend({
  token: z.string().min(1),
});
export type ResetPasswordInput = z.infer<typeof resetPasswordInputSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: passwordSchema,
});
export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

export type { ActionResult } from "@/lib/action-result";

export function firstIssue(error: z.ZodError) {
  return error.issues[0]?.message ?? "Invalid input";
}
