// lib/prismaWrapper.ts
import { Prisma } from "@/app/generated/prisma/browser";
import prisma from "@/lib/prisma";

// Dynamically get all Prisma models
type PrismaModels = keyof typeof prisma;
type ModelName = Exclude<PrismaModels, `$${string}`>; // exclude internal $ methods

type Tx = Prisma.TransactionClient;

interface LogContext {
  userId: string | null;
  submodule?: string;
  // Module stored in ActionLog. Defaults to the model name
  module?: string;
  // Join a caller's transaction instead of opening a new one
  tx?: Tx;
}

// The record write and its ActionLog row commit (or roll back) together
function inTransaction<T>(context: LogContext, fn: (tx: Tx) => Promise<T>) {
  return context.tx ? fn(context.tx) : prisma.$transaction(fn);
}

// -------------------- CREATE --------------------
export async function createWithLog<T>(
  model: ModelName,
  data: any,
  context: LogContext,
  options?: any,
): Promise<T> {
  return inTransaction(context, async (tx) => {
    const result = await (tx as any)[model].create({ data, ...options });

    await tx.actionLog.create({
      data: {
        userId: context.userId,
        module: context.module ?? String(model),
        submodule: context.submodule ?? result.id,
        action: "create",
        recordId: result.id,
        before: Prisma.JsonNull,
        after: result ?? Prisma.JsonNull,
      },
    });

    return result as T;
  });
}

// -------------------- UPDATE --------------------
export async function updateWithLog<T>(
  model: ModelName,
  where: any,
  data: any,
  context: LogContext,
  options?: any,
): Promise<T> {
  return inTransaction(context, async (tx) => {
    const before = await (tx as any)[model].findUnique({ where, ...options });

    // Throws P2025 if `where` no longer matches (e.g. a status guard)
    const result = await (tx as any)[model].update({
      where,
      data,
      ...options,
    });

    await tx.actionLog.create({
      data: {
        userId: context.userId,
        module: context.module ?? String(model),
        submodule: context.submodule ?? result.id,
        action: "update",
        recordId: result.id,
        before: before ?? Prisma.JsonNull,
        after: result ?? Prisma.JsonNull,
      },
    });

    return result as T;
  });
}

// -------------------- DELETE --------------------
export async function deleteWithLog<T>(
  model: ModelName,
  where: any,
  context: LogContext,
  options?: { include?: any; before?: any },
): Promise<T> {
  return inTransaction(context, async (tx) => {
    const before =
      options?.before ??
      (await (tx as any)[model].findUnique({
        where,
        include: options?.include ?? {},
      }));

    const result = await (tx as any)[model].delete({ where });

    await tx.actionLog.create({
      data: {
        userId: context.userId,
        module: context.module ?? String(model),
        submodule: context.submodule ?? result.id?.toString() ?? null,
        action: "delete",
        recordId: result.id,
        before: before ?? Prisma.JsonNull,
        after: Prisma.JsonNull,
      },
    });

    return result as T;
  });
}
