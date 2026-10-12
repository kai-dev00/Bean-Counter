"use server";

import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-guard";
import { getCurrentUser, getCurrentUserWithName } from "@/lib/auth";
import {
  createWithLog,
  deleteWithLog,
  updateWithLog,
} from "@/lib/types/prismaLogger";
import { InventoryFormValues, inventorySchema } from "./schema";
import { computeInventoryStatus } from "../utils";
import { Decimal } from "@prisma/client/runtime/client";
import { realtime } from "@/lib/upstash/realtime";

//only use decimal in the action serve and numbers in the client

export async function createInventory(input: InventoryFormValues) {
  await requirePermission("inventory:create");
  const { discontinued, ...values } = inventorySchema.parse(input);

  const status = computeInventoryStatus(
    values.quantity,
    values.minimumStock,
    discontinued,
  );

  // const currentUser = await getCurrentUser();
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
      // createdBy: userId,
      createdBy: currentUser?.fullName ?? "System", // use id or name?
    },
    {
      userId,
      submodule: "", //manually add submodule for now
    },
  )) as { id: string };
  await realtime.emit("activity.created", {
    action: "create",
    module: "inventory",
    submodule: "",
    recordId: inventory.id,
    user: currentUser?.fullName ?? null,
    createdAt: new Date().toISOString(),
  });
  return { success: true }; //or if u want to return the new added name
}

export async function updateInventory(id: string, values: InventoryFormValues) {
  await requirePermission("inventory:update");
  values = inventorySchema.parse(values);

  // const currentUser = await getCurrentUser();
  const currentUser = await getCurrentUserWithName();
  const userId = currentUser?.userId ?? null;
  if (!id) throw new Error("Inventory ID is required for editing");

  const existing = await prisma.inventory.findUnique({ where: { id } });
  if (!existing) throw new Error("Inventory not found");

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
      updatedBy: currentUser?.fullName ?? "System", // use id or name?
      updatedAt: new Date(),
    },
    {
      userId,
      submodule: "",
    },
  )) as { id: string };

  await realtime.emit("activity.created", {
    action: "update",
    module: "inventory",
    submodule: "",
    recordId: updatedInventory.id,
    user: currentUser?.fullName ?? null,
    createdAt: new Date().toISOString(),
  });

  return { success: true };
}

export async function deleteInventory(id: string) {
  await requirePermission("inventory:delete");

  // const currentUser = await getCurrentUser();
  const currentUser = await getCurrentUserWithName();

  const userId = currentUser?.userId ?? null;

  if (!id) throw new Error("Inventory ID is required");

  const existing = await prisma.inventory.findUnique({ where: { id } });
  if (!existing) throw new Error("Inventory not found");

  const deletedInventory = (await deleteWithLog(
    "inventory",
    { id },
    { userId, submodule: "" },
  )) as { id: string };
  await realtime.emit("activity.created", {
    action: "delete",
    module: "inventory",
    submodule: "",
    recordId: deletedInventory.id,
    user: currentUser?.fullName ?? null,
    createdAt: new Date().toISOString(),
  });
  return { success: true, deletedInventory };
}
