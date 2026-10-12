import { realtime } from "@/lib/upstash/realtime";
import { verifyAccessToken, verifyRefreshToken } from "@/lib/jwt";
import prisma from "@/lib/prisma";
import { handle } from "@upstash/realtime";
import { cookies } from "next/headers";

// Resolves the user from the access token, falling back to the refresh token
// so a long-open dashboard keeps its feed after the 15-min access token expires
async function getUserId() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;
  const refreshToken = cookieStore.get("refresh_token")?.value;

  if (accessToken) {
    try {
      return (await verifyAccessToken(accessToken)).userId;
    } catch {}
  }
  if (refreshToken) {
    try {
      return (await verifyRefreshToken(refreshToken)).userId;
    } catch {}
  }
  return null;
}

export const GET = handle({
  realtime,
  middleware: async () => {
    const userId = await getUserId();
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isActive: true },
    });
    if (!user?.isActive) return new Response("Unauthorized", { status: 401 });
  },
});
