import { cache } from "react";
import { redirect } from "next/navigation";
import prisma from "./prisma";
import { getCurrentUser } from "./auth";

// Cached per request, so a page that calls several guarded helpers
// only hits the database once
export const getPermissionStrings = cache(async (): Promise<string[] | null> => {
  const session = await getCurrentUser();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      role: {
        select: {
          permissions: {
            select: {
              action: true,
              module: true,
              submodule: true,
            },
          },
        },
      },
    },
  });

  return (
    user?.role.permissions.map((p) =>
      [p.module, p.action, p.submodule].filter(Boolean).join(":"),
    ) ?? []
  );
});

// Call at the top of every server action and page.tsx, outside any try/catch
// (redirect() works by throwing)
export async function requirePermission(permission: string) {
  const permissions = await getPermissionStrings();
  if (!permissions) redirect("/login");

  if (!permissions.includes(permission)) {
    redirect("/dashboard/no-permission");
  }
}
