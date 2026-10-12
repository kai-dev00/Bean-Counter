// purchases/actions.ts
"use server";

import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-guard";
import { getCurrentUserWithName } from "@/lib/auth";
import {
  createWithLog,
  updateWithLog,
  deleteWithLog,
} from "@/lib/types/prismaLogger";
import { PurchaseFormValues, purchaseSchema } from "./schema";
import { Decimal } from "@prisma/client/runtime/client";
import { emitActivity } from "@/lib/upstash/realtime";
import { computeInventoryStatus } from "../utils";
import { ActionError, ActionResult, runAction } from "@/lib/action-result";

// Status changes and edits only apply while the purchase is still a draft.
// Putting status in the `where` makes the check and the write one atomic
// step, so two people can't e.g. receive the same purchase twice
const NOT_DRAFT = "This purchase is no longer a draft. Refresh and try again.";

export async function createPurchase(
  values: PurchaseFormValues,
): Promise<ActionResult> {
  await requirePermission("purchase:create");

  return runAction(
    async () => {
      values = purchaseSchema.parse(values);

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

      await emitActivity({
        action: "create",
        module: "purchase",
        submodule: null,
        recordId: purchase.id,
        user: currentUser?.fullName ?? null,
        createdAt: new Date().toISOString(),
      });
    },
    { P2003: "The selected supplier or an item no longer exists." },
  );
}

export async function updatePurchase(
  id: string,
  values: PurchaseFormValues,
): Promise<ActionResult> {
  await requirePermission("purchase:update");

  return runAction(
    async () => {
      values = purchaseSchema.parse(values);

      const currentUser = await getCurrentUserWithName();
      const userId = currentUser?.userId ?? null;

      const existing = await prisma.purchase.findUnique({ where: { id } });
      if (!existing) throw new ActionError("Purchase not found");
      if (existing.status !== "DRAFT")
        throw new ActionError("Only DRAFT purchases can be edited");

      const total = values.items.reduce(
        (sum, item) => sum + item.quantity * item.unitCost,
        0,
      );

      // Replacing the items happens in the same update (and transaction) as
      // the rest of the purchase, so a failure can't leave it with no items
      await updateWithLog(
        "purchase",
        { id, status: "DRAFT" },
        {
          supplierId: values.supplierId,
          notes: values.notes,
          total: new Decimal(total),
          updatedBy: currentUser?.fullName ?? "System",
          updatedAt: new Date(),
          items: {
            deleteMany: {},
            create: values.items.map((item) => ({
              inventoryId: item.inventoryId,
              quantity: new Decimal(item.quantity),
              unitCost: new Decimal(item.unitCost),
            })),
          },
        },
        { userId, submodule: "" },
      );

      await emitActivity({
        action: "update",
        module: "purchase",
        submodule: null,
        recordId: id,
        user: currentUser?.fullName ?? null,
        createdAt: new Date().toISOString(),
      });
    },
    {
      P2025: NOT_DRAFT,
      P2003: "The selected supplier or an item no longer exists.",
    },
  );
}

export async function receivePurchase(id: string): Promise<ActionResult> {
  await requirePermission("purchase:update");

  return runAction(
    async () => {
      const currentUser = await getCurrentUserWithName();
      const userId = currentUser?.userId ?? null;

      const purchase = await prisma.purchase.findUnique({
        where: { id },
        include: { items: true },
      });

      if (!purchase) throw new ActionError("Purchase not found");
      if (purchase.status !== "DRAFT")
        throw new ActionError("Only DRAFT purchases can be received");

      // Marking it received and adding the stock commit together: either
      // every item's stock goes up and the status changes, or nothing does
      await prisma.$transaction(async (tx) => {
        // Claim the purchase first. If someone else received or cancelled it
        // in the meantime this throws P2025 and nothing below runs
        await updateWithLog(
          "purchase",
          { id, status: "DRAFT" },
          {
            status: "RECEIVED",
            updatedBy: currentUser?.fullName ?? "System",
            updatedAt: new Date(),
          },
          { userId, submodule: "", tx },
        );

        // Add stock, then recompute status from the new quantity
        for (const item of purchase.items) {
          const updated = await tx.inventory.update({
            where: { id: item.inventoryId },
            data: {
              quantity: { increment: item.quantity },
            },
            select: { quantity: true, minimumStock: true, status: true },
          });
          await tx.inventory.update({
            where: { id: item.inventoryId },
            data: {
              status: computeInventoryStatus(
                updated.quantity.toNumber(),
                updated.minimumStock,
                updated.status === "discontinued",
              ),
            },
          });
        }
      }, { timeout: 15_000 }); // 2 queries per line item; the 5s default is tight on a remote DB

      await emitActivity({
        action: "update",
        module: "purchase",
        submodule: null,
        recordId: id,
        user: currentUser?.fullName ?? null,
        createdAt: new Date().toISOString(),
      });
    },
    { P2025: NOT_DRAFT },
  );
}

export async function cancelPurchase(id: string): Promise<ActionResult> {
  await requirePermission("purchase:update");

  return runAction(
    async () => {
      const currentUser = await getCurrentUserWithName();
      const userId = currentUser?.userId ?? null;

      const existing = await prisma.purchase.findUnique({ where: { id } });
      if (!existing) throw new ActionError("Purchase not found");
      if (existing.status !== "DRAFT")
        throw new ActionError("Only DRAFT purchases can be cancelled");

      await updateWithLog(
        "purchase",
        { id, status: "DRAFT" },
        {
          status: "CANCELLED",
          updatedBy: currentUser?.fullName ?? "System",
          updatedAt: new Date(),
        },
        { userId, submodule: "" },
      );

      await emitActivity({
        action: "update",
        module: "purchase",
        submodule: null,
        recordId: id,
        user: currentUser?.fullName ?? null,
        createdAt: new Date().toISOString(),
      });
    },
    { P2025: NOT_DRAFT },
  );
}

export async function deletePurchase(id: string): Promise<ActionResult> {
  await requirePermission("purchase:delete");

  return runAction(
    async () => {
      const currentUser = await getCurrentUserWithName();
      const userId = currentUser?.userId ?? null;

      const existing = await prisma.purchase.findUnique({ where: { id } });
      if (!existing) throw new ActionError("Purchase not found");
      if (existing.status !== "DRAFT")
        throw new ActionError("Only DRAFT purchases can be deleted");

      await deleteWithLog(
        "purchase",
        { id, status: "DRAFT" },
        { userId, submodule: "" },
      );

      await emitActivity({
        action: "delete",
        module: "purchase",
        submodule: null,
        recordId: id,
        user: currentUser?.fullName ?? null,
        createdAt: new Date().toISOString(),
      });
    },
    { P2025: NOT_DRAFT },
  );
}
