"use server";

import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-guard";

// Older entries are still in the database; the page only shows the newest ones
const LOG_LIMIT = 1000;

// Never send these to the browser, even to admins
const SENSITIVE_KEYS = new Set(["password", "token"]);

export type LogSnapshot = Record<string, unknown> | null;

function redact(value: unknown): LogSnapshot {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return Object.fromEntries(
    Object.entries(value).map(([key, v]) =>
      SENSITIVE_KEYS.has(key) ? [key, "[hidden]"] : [key, v],
    ),
  );
}

export async function getActionLogs() {
  await requirePermission("access-management:read:logs");

  const logs = await prisma.actionLog.findMany({
    orderBy: { createdAt: "desc" },
    take: LOG_LIMIT,
    include: { user: { select: { firstName: true, lastName: true, email: true } } },
  });

  return logs.map((log) => ({
    id: log.id,
    recordId: log.recordId,
    module: log.module,
    submodule: log.submodule,
    action: log.action,
    createdAt: log.createdAt,
    performedBy: log.user
      ? `${log.user.firstName} ${log.user.lastName}`
      : log.userId
        ? "Deleted user"
        : "System",
    performedByEmail: log.user?.email ?? null,
    before: redact(log.before),
    after: redact(log.after),
  }));
}
