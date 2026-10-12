"use server";

import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-guard";
import { CategoryFormValues, categorySchema } from "./schema";
import { getCurrentUserWithName } from "@/lib/auth";
import {
  createWithLog,
  deleteWithLog,
  updateWithLog,
} from "@/lib/types/prismaLogger";
import { emitActivity } from "@/lib/upstash/realtime";
import { ActionError, ActionResult, runAction } from "@/lib/action-result";

export async function createCategory(
  values: CategoryFormValues,
): Promise<ActionResult> {
  await requirePermission("category:create");

  return runAction(
    async () => {
      values = categorySchema.parse(values);

      const currentUser = await getCurrentUserWithName();
      const userId = currentUser?.userId ?? null;
      const category = (await createWithLog(
        "category",
        {
          name: values.name,
          description: values.description,
          icon: values.icon,
          color: values.color,
          createdBy: currentUser?.fullName ?? "System",
        },
        {
          userId,
          submodule: "", //manually add submodule for now
        },
      )) as { id: string };
      await emitActivity({
        action: "create",
        module: "category",
        submodule: "",
        recordId: category.id,
        user: currentUser?.fullName ?? null,
        createdAt: new Date().toISOString(),
      });
    },
    { P2002: "A category with this name already exists." },
  );
}

export async function updateCategory(
  id: string,
  values: CategoryFormValues,
): Promise<ActionResult> {
  await requirePermission("category:update");

  return runAction(
    async () => {
      values = categorySchema.parse(values);

      const currentUser = await getCurrentUserWithName();
      const userId = currentUser?.userId ?? null;
      if (!id) {
        throw new ActionError("Category ID is required for editing");
      }
      const existing = await prisma.category.findUnique({
        where: { id: id },
      });
      if (!existing) {
        throw new ActionError("Category not found");
      }

      const updatedCategory = (await updateWithLog(
        "category",
        { id },
        {
          name: values.name,
          icon: values.icon,
          color: values.color,
          description: values.description,
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
        module: "category",
        submodule: "",
        recordId: updatedCategory.id,
        user: currentUser?.fullName ?? null,
        createdAt: new Date().toISOString(),
      });
    },
    { P2002: "A category with this name already exists." },
  );
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  await requirePermission("category:delete");

  return runAction(
    async () => {
      const currentUser = await getCurrentUserWithName();
      const userId = currentUser?.userId ?? null;
      if (!id) {
        throw new ActionError("Category ID is required");
      }
      const existing = await prisma.category.findUnique({
        where: { id: id },
      });
      if (!existing) {
        throw new ActionError("Category not found");
      }

      const itemCount = await prisma.inventory.count({
        where: { categoryId: id },
      });
      if (itemCount > 0) {
        throw new ActionError(
          `This category still has ${itemCount} item(s). Move them to another category or delete them first.`,
        );
      }

      const deletedCategory = (await deleteWithLog(
        "category",
        { id },
        { userId, submodule: "" },
      )) as { id: string };
      await emitActivity({
        action: "delete",
        module: "category",
        submodule: "",
        recordId: deletedCategory.id,
        user: currentUser?.fullName ?? null,
        createdAt: new Date().toISOString(),
      });
    },
    {
      // An item was added between the count above and the delete
      // (the FK is ON DELETE RESTRICT)
      P2003: "This category still has items. Refresh and try again.",
    },
  );
}
