"use server";

import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-guard";
import { getCurrentUserWithName } from "@/lib/auth";
import {
  createWithLog,
  deleteWithLog,
  updateWithLog,
} from "@/lib/types/prismaLogger";
import { InventoryFormValues, inventorySchema } from "./schema";
import { computeInventoryStatus } from "../utils";
import { Decimal } from "@prisma/client/runtime/client";
import { emitActivity } from "@/lib/upstash/realtime";
import { ActionError, ActionResult, runAction } from "@/lib/action-result";

//only use decimal in the action serve and numbers in the client

export async function createInventory(
  input: InventoryFormValues,
): Promise<ActionResult> {
  await requirePermission("inventory:create");

  return runAction(
    async () => {
      const { discontinued, ...values } = inventorySchema.parse(input);

      const status = computeInventoryStatus(
        values.quantity,
        values.minimumStock,
        discontinued,
      );

      const currentUser = await getCurrentUserWithName();
      const userId = currentUser?.userId ?? null;
      const inventory = (await createWithLog(
        "inventory",
        {
          ...values,
          quantity: new Decimal(values.quantity),
          minimumStock: new Decimal(values.minimumStock),
          unitPrice: new Decimal(values.unitPrice),
          status,
          createdBy: currentUser?.fullName ?? "System",
        },
        {
          userId,
          submodule: "", //manually add submodule for now
        },
      )) as { id: string };
      await emitActivity({
        action: "create",
        module: "inventory",
        submodule: "",
        recordId: inventory.id,
        user: currentUser?.fullName ?? null,
        createdAt: new Date().toISOString(),
      });
    },
    {
      P2002: "An item with this name already exists.",
      P2003: "The selected category no longer exists.",
    },
  );
}

export async function updateInventory(
  id: string,
  values: InventoryFormValues,
): Promise<ActionResult> {
  await requirePermission("inventory:update");

  return runAction(
    async () => {
      values = inventorySchema.parse(values);

      const currentUser = await getCurrentUserWithName();
      const userId = currentUser?.userId ?? null;
      if (!id) throw new ActionError("Inventory ID is required for editing");

      const existing = await prisma.inventory.findUnique({ where: { id } });
      if (!existing) throw new ActionError("Inventory not found");

      const status = computeInventoryStatus(
        values.quantity,
        values.minimumStock,
        values.discontinued,
      );
      const updatedInventory = (await updateWithLog(
        "inventory",
        { id },
        {
          name: values.name,
          description: values.description,
          quantity: new Decimal(values.quantity),
          minimumStock: new Decimal(values.minimumStock),
          unitPrice: new Decimal(values.unitPrice),
          status,
          categoryId: values.categoryId,
          updatedBy: currentUser?.fullName ?? "System",
          updatedAt: new Date(),
        },
        {
          userId,
          submodule: "",
        },
      )) as { id: string };

      await emitActivity({
        action: "update",
        module: "inventory",
        submodule: "",
        recordId: updatedInventory.id,
        user: currentUser?.fullName ?? null,
        createdAt: new Date().toISOString(),
      });
    },
    {
      P2002: "An item with this name already exists.",
      P2003: "The selected category no longer exists.",
    },
  );
}

export async function deleteInventory(id: string): Promise<ActionResult> {
  await requirePermission("inventory:delete");

  return runAction(
    async () => {
      const currentUser = await getCurrentUserWithName();
      const userId = currentUser?.userId ?? null;

      if (!id) throw new ActionError("Inventory ID is required");

      const existing = await prisma.inventory.findUnique({ where: { id } });
      if (!existing) throw new ActionError("Inventory not found");

      const deletedInventory = (await deleteWithLog(
        "inventory",
        { id },
        { userId, submodule: "" },
      )) as { id: string };
      await emitActivity({
        action: "delete",
        module: "inventory",
        submodule: "",
        recordId: deletedInventory.id,
        user: currentUser?.fullName ?? null,
        createdAt: new Date().toISOString(),
      });
    },
    {
      P2003:
        "This item appears on purchases, so it can't be deleted. Mark it as discontinued instead.",
    },
  );
}
