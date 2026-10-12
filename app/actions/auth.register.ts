"use server";

import prisma from "@/lib/prisma";
import {
  ActionResult,
  firstIssue,
  RegisterInput,
  registerInputSchema,
} from "@/lib/validation/auth";
import bcrypt from "bcryptjs";

export async function registerUserAction(
  data: RegisterInput,
): Promise<ActionResult> {
  const parsed = registerInputSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: firstIssue(parsed.error) };
  }
  const { token, password, phoneNumber } = parsed.data;

  const invite = await prisma.userInvite.findUnique({
    where: { token },
  });

  if (!invite) {
    return { success: false, error: "Invalid token" };
  }

  if (invite.expiresAt < new Date()) {
    return { success: false, error: "Token expired" };
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: invite.email },
  });

  if (existingUser) {
    return { success: false, error: "User already registered" };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.$transaction([
    prisma.user.create({
      data: {
        email: invite.email,
        firstName: invite.firstName,
        lastName: invite.lastName,
        fullName: `${invite.firstName} ${invite.lastName}`,
        roleId: invite.roleId,
        password: hashedPassword,
        phoneNumber: phoneNumber,
        isActive: true,
        emailVerifiedAt: new Date(),
      },
    }),
    prisma.userInvite.delete({
      where: { token },
    }),
  ]);

  return { success: true };
}
