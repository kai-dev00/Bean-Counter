"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getCurrentUser } from "@/lib/auth";
import {
  ActionResult,
  ChangePasswordFormValues,
  changePasswordSchema,
  firstIssue,
} from "@/lib/validation/auth";

export async function changePasswordAction(
  data: ChangePasswordFormValues,
): Promise<ActionResult> {
  const parsed = changePasswordSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: firstIssue(parsed.error) };
  }
  const { currentPassword, newPassword } = parsed.data;

  const sessionUser = await getCurrentUser();

  if (!sessionUser) {
    return { success: false, error: "Unauthorized" };
  }

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.userId },
  });

  if (!user) {
    return { success: false, error: "User not found" };
  }

  const isValid = await bcrypt.compare(currentPassword, user.password);

  if (!isValid) {
    return { success: false, error: "Current password is incorrect" };
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    }),

    // 🔐 optional but recommended
    prisma.session.updateMany({
      where: {
        userId: user.id,
        revoked: false,
      },
      data: { revoked: true },
    }),
  ]);

  return { success: true };
}
