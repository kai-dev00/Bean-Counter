"use server";

import prisma from "@/lib/prisma";
import {
  ActionResult,
  firstIssue,
  ResetPasswordInput,
  resetPasswordInputSchema,
} from "@/lib/validation/auth";
import bcrypt from "bcryptjs";

export async function resetPasswordAction(
  data: ResetPasswordInput,
): Promise<ActionResult> {
  const parsed = resetPasswordInputSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: firstIssue(parsed.error) };
  }
  const { token, password } = parsed.data;

  const reset = await prisma.passwordReset.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!reset) {
    return { success: false, error: "Invalid token" };
  }

  if (reset.usedAt) {
    return { success: false, error: "Token already used" };
  }

  if (reset.expiresAt < new Date()) {
    return { success: false, error: "Token expired" };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: reset.userId },
      data: { password: hashedPassword },
    }),
    prisma.passwordReset.update({
      where: { id: reset.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return { success: true };
}
