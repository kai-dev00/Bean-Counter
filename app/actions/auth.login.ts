"use server";

import { setAuthCookies } from "@/lib/cookies";
import { signAccessToken, signRefreshToken } from "@/lib/jwt";
import prisma from "@/lib/prisma";
import { checkLoginLimit, resetLoginLimit } from "@/lib/upstash/ratelimit";
import {
  ActionResult,
  firstIssue,
  LoginFormValues,
  loginSchema,
} from "@/lib/validation/auth";
import bcrypt from "bcryptjs";

export async function loginAction(data: LoginFormValues): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: firstIssue(parsed.error) };
  }
  const { email, password } = parsed.data;

  if (!(await checkLoginLimit(email))) {
    return {
      success: false,
      error: "Too many login attempts. Please try again later.",
    };
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return { success: false, error: "Invalid email or password" };
  }

  if (!user.isActive) {
    return { success: false, error: "This account has been deactivated" };
  }

  const accessToken = await signAccessToken({
    userId: user.id,
    roleId: user.roleId,
  });

  const refreshToken = await signRefreshToken({
    userId: user.id,
  });

  await prisma.session.create({
    data: {
      userId: user.id,
      refreshTokenHash: await bcrypt.hash(refreshToken, 10),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  await setAuthCookies(accessToken, refreshToken);
  await resetLoginLimit(email);
  return { success: true };
}
