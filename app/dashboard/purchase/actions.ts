// purchases/actions.ts
"use server";

import prisma from "@/lib/prisma";
import { getCurrentUserWithName } from "@/lib/auth";
import {
  createWithLog,
  updateWithLog,
  deleteWithLog,
} from "@/lib/types/prismaLogger";
import { PurchaseFormValues } from "./schema";
import { Decimal } from "@prisma/client/runtime/client";
import { realtime } from "@/lib/upstash/realtime";
import { computeInventoryStatus } from "../utils";

export async function createPurchase(values: PurchaseFormValues) {
  const currentUser = await getCurrentUserWithName();
  const userId = currentUser?.userId ?? null;

  const total = values.items.reduce(
    (sum, item) => sum + item.quantity * item.unitCost,
    0,
  );

  const purchase = (await createWithLog(
    "purchase",
    {
      supplierId: values.supplierId,
      notes: values.notes,
      total: new Decimal(total),
      createdBy: currentUser?.fullName ?? "System",
      items: {
        create: values.items.map((item) => ({
          inventoryId: item.inventoryId,
          quantity: new Decimal(item.quantity),
          unitCost: new Decimal(item.unitCost),
        })),
      },
    },
    { userId, submodule: "" },
  )) as { id: string };

  await realtime.emit("activity.created", {
    action: "create",
    module: "purchase",
    submodule: null,
    recordId: purchase.id,
    user: currentUser?.fullName ?? null,
    createdAt: new Date().toISOString(),
  });

  return { success: true };
}

export async function updatePurchase(id: string, values: PurchaseFormValues) {
  const currentUser = await getCurrentUserWithName();
  const userId = currentUser?.userId ?? null;

  const existing = await prisma.purchase.findUnique({ where: { id } });
  if (!existing) throw new Error("Purchase not found");
  if (existing.status !== "DRAFT")
    throw new Error("Only DRAFT purchases can be edited");

  const total = values.items.reduce(
    (sum, item) => sum + item.quantity * item.unitCost,
    0,
  );

  // delete old items and recreate
  await prisma.purchaseItem.deleteMany({ where: { purchaseId: id } });

  await updateWithLog(
    "purchase",
    { id },
    {
      supplierId: values.supplierId,
      notes: values.notes,
      total: new Decimal(total),
      updatedBy: currentUser?.fullName ?? "System",
      updatedAt: new Date(),
      items: {
        create: values.items.map((item) => ({
          inventoryId: item.inventoryId,
          quantity: new Decimal(item.quantity),
          unitCost: new Decimal(item.unitCost),
        })),
      },
    },
    { userId, submodule: "" },
  );

  await realtime.emit("activity.created", {
    action: "update",
    module: "purchase",
    submodule: null,
    recordId: id,
    user: currentUser?.fullName ?? null,
    createdAt: new Date().toISOString(),
  });

  return { success: true };
}

export async function receivePurchase(id: string) {
  const currentUser = await getCurrentUserWithName();
  const userId = currentUser?.userId ?? null;

  const purchase = await prisma.purchase.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!purchase) throw new Error("Purchase not found");
  if (purchase.status !== "DRAFT")
    throw new Error("Only DRAFT purchases can be received");

  // update inventory quantities, then recompute status from the new quantity
  await Promise.all(
    purchase.items.map(async (item) => {
      const updated = await prisma.inventory.update({
        where: { id: item.inventoryId },
        data: {
          quantity: { increment: item.quantity },
        },
        select: { quantity: true, minimumStock: true, status: true },
      });
      await prisma.inventory.update({
        where: { id: item.inventoryId },
        data: {
          status: computeInventoryStatus(
            updated.quantity.toNumber(),
            updated.minimumStock,
            updated.status === "discontinued",
          ),
        },
      });
    }),
  );

  await updateWithLog(
    "purchase",
    { id },
    {
      status: "RECEIVED",
      updatedBy: currentUser?.fullName ?? "System",
      updatedAt: new Date(),
    },
    { userId, submodule: "" },
  );

  await realtime.emit("activity.created", {
    action: "update",
    module: "purchase",
    submodule: null,
    recordId: id,
    user: currentUser?.fullName ?? null,
    createdAt: new Date().toISOString(),
  });

  return { success: true };
}

export async function cancelPurchase(id: string) {
  const currentUser = await getCurrentUserWithName();
  const userId = currentUser?.userId ?? null;

  const existing = await prisma.purchase.findUnique({ where: { id } });
  if (!existing) throw new Error("Purchase not found");
  if (existing.status !== "DRAFT")
    throw new Error("Only DRAFT purchases can be cancelled");

  await updateWithLog(
    "purchase",
    { id },
    {
      status: "CANCELLED",
      updatedBy: currentUser?.fullName ?? "System",
      updatedAt: new Date(),
    },
    { userId, submodule: "" },
  );

  await realtime.emit("activity.created", {
    action: "update",
    module: "purchase",
    submodule: null,
    recordId: id,
    user: currentUser?.fullName ?? null,
    createdAt: new Date().toISOString(),
  });

  return { success: true };
}

export async function deletePurchase(id: string) {
  const currentUser = await getCurrentUserWithName();
  const userId = currentUser?.userId ?? null;

  const existing = await prisma.purchase.findUnique({ where: { id } });
  if (!existing) throw new Error("Purchase not found");
  if (existing.status !== "DRAFT")
    throw new Error("Only DRAFT purchases can be deleted");

  await deleteWithLog("purchase", { id }, { userId, submodule: "" });

  await realtime.emit("activity.created", {
    action: "delete",
    module: "purchase",
    submodule: null,
    recordId: id,
    user: currentUser?.fullName ?? null,
    createdAt: new Date().toISOString(),
  });

  return { success: true };
}
