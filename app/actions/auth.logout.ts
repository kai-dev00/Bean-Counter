"use server";

import { clearAuthCookies } from "@/lib/cookies";
import { verifyRefreshToken } from "@/lib/jwt";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function logoutAction() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refresh_token")?.value;

  if (refreshToken) {
    try {
      const payload = await verifyRefreshToken(refreshToken);

      const sessions = await prisma.session.findMany({
        where: { userId: payload.userId, revoked: false },
      });

      // Revoke only the session tied to this browser's refresh token
      const session = sessions.find((s) =>
        bcrypt.compareSync(refreshToken, s.refreshTokenHash),
      );

      if (session) {
        await prisma.session.update({
          where: { id: session.id },
          data: { revoked: true },
        });
      }
    } catch {
      // Invalid or expired refresh token: nothing to revoke, just clear cookies
    }
  }

  await clearAuthCookies();
  redirect("/login");
}
