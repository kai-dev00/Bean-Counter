"use server";

import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "@/lib/jwt";
import { setAuthCookies } from "@/lib/cookies";

export async function refreshAction() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refresh_token")?.value;

  if (!refreshToken) throw new Error("No refresh token");

  const payload = await verifyRefreshToken(refreshToken); // ← Add await

  const sessions = await prisma.session.findMany({
    where: {
      userId: payload.userId,
      revoked: false,
      expiresAt: { gt: new Date() },
    },
  });

  const session = sessions.find((s) =>
    bcrypt.compareSync(refreshToken, s.refreshTokenHash),
  );

  if (!session) throw new Error("Invalid session");

  // Revoke old session
  await prisma.session.update({
    where: { id: session.id },
    data: { revoked: true },
  });

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { roleId: true, isActive: true },
  });

  if (!user) throw new Error("User not found");
  if (!user.isActive) throw new Error("User is deactivated");

  // Create new tokens (both need await now!)
  const accessToken = await signAccessToken({
    userId: payload.userId,
    roleId: user.roleId,
  });

  const newRefreshToken = await signRefreshToken({
    userId: payload.userId,
  });

  await prisma.session.create({
    data: {
      userId: payload.userId,
      refreshTokenHash: await bcrypt.hash(newRefreshToken, 10),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  await setAuthCookies(accessToken, newRefreshToken);
}
