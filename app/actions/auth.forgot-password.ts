"use server";

import { sendResetPasswordEmail } from "@/lib/email";
import prisma from "@/lib/prisma";
import { checkForgotPasswordLimit } from "@/lib/upstash/ratelimit";
import {
  ActionResult,
  firstIssue,
  ForgotPasswordFormValues,
  forgotPasswordSchema,
} from "@/lib/validation/auth";
import { randomBytes } from "crypto";

export async function forgotPasswordAction(
  data: ForgotPasswordFormValues,
): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: firstIssue(parsed.error) };
  }
  const { email } = parsed.data;

  if (!(await checkForgotPasswordLimit(email))) {
    return {
      success: false,
      error: "Too many requests. Please try again later.",
    };
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  // Security: same response whether or not the user exists
  if (!user) {
    return { success: true };
  }
  const token = randomBytes(32).toString("hex");

  await prisma.passwordReset.create({
    data: {
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 1000 * 60 * 30), // 30 mins
    },
  });

  await sendResetPasswordEmail(user.email, token);
  return { success: true };
}
