"use server";

import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-guard";
import { getCurrentUserWithName } from "@/lib/auth";
import {
  createWithLog,
  deleteWithLog,
  updateWithLog,
} from "@/lib/types/prismaLogger";
import { emitActivity } from "@/lib/upstash/realtime";
import { SupplierFormValues, supplierSchema } from "./schema";
import { ActionError, ActionResult, runAction } from "@/lib/action-result";

export async function createSupplier(
  values: SupplierFormValues,
): Promise<ActionResult> {
  await requirePermission("supplier:create");

  return runAction(
    async () => {
      values = supplierSchema.parse(values);

      const currentUser = await getCurrentUserWithName();
      const userId = currentUser?.userId ?? null;
      const supplier = (await createWithLog(
        "supplier",
        {
          name: values.name,
          email: values.email,
          phone: values.phone,
          address: values.address,
          notes: values.notes,
          createdBy: currentUser?.fullName ?? "System",
        },
        {
          userId,
          submodule: "", //manually add submodule for now
        },
      )) as { id: string };
      await emitActivity({
        action: "create",
        module: "supplier",
        submodule: "",
        recordId: supplier.id,
        user: currentUser?.fullName ?? null,
        createdAt: new Date().toISOString(),
      });
    },
    { P2002: "A supplier with this name already exists." },
  );
}

//update

export async function updateSupplier(
  id: string,
  values: SupplierFormValues,
): Promise<ActionResult> {
  await requirePermission("supplier:update");

  return runAction(
    async () => {
      values = supplierSchema.parse(values);

      const currentUser = await getCurrentUserWithName();
      const userId = currentUser?.userId ?? null;
      if (!id) {
        throw new ActionError("Supplier ID is required for editing");
      }
      const existing = await prisma.supplier.findUnique({
        where: { id: id },
      });
      if (!existing) {
        throw new ActionError("Supplier not found");
      }

      const updatedSupplier = (await updateWithLog(
        "supplier",
        { id },
        {
          name: values.name,
          email: values.email,
          phone: values.phone,
          address: values.address,
          notes: values.notes,
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
        module: "supplier",
        submodule: "",
        recordId: updatedSupplier.id,
        user: currentUser?.fullName ?? null,
        createdAt: new Date().toISOString(),
      });
    },
    { P2002: "A supplier with this name already exists." },
  );
}

//delete

export async function deleteSupplier(id: string): Promise<ActionResult> {
  await requirePermission("supplier:delete");

  return runAction(
    async () => {
      const currentUser = await getCurrentUserWithName();
      const userId = currentUser?.userId ?? null;
      if (!id) {
        throw new ActionError("Supplier ID is required");
      }
      const existing = await prisma.supplier.findUnique({
        where: { id: id },
      });
      if (!existing) {
        throw new ActionError("Supplier not found");
      }

      const deletedSupplier = (await deleteWithLog(
        "supplier",
        { id },
        { userId, submodule: "" },
      )) as { id: string };
      await emitActivity({
        action: "delete",
        module: "supplier",
        submodule: "",
        recordId: deletedSupplier.id,
        user: currentUser?.fullName ?? null,
        createdAt: new Date().toISOString(),
      });
    },
    { P2003: "This supplier has purchases, so it can't be deleted." },
  );
}
