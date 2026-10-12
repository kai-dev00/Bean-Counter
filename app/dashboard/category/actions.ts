"use server";

import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-guard";
import { CategoryFormValues, categorySchema } from "./schema";
import { getCurrentUser, getCurrentUserWithName } from "@/lib/auth";
import {
  createWithLog,
  deleteWithLog,
  updateWithLog,
} from "@/lib/types/prismaLogger";
import { realtime } from "@/lib/upstash/realtime";

export async function createCategory(values: CategoryFormValues) {
  await requirePermission("category:create");
  values = categorySchema.parse(values);

  // const currentUser = await getCurrentUser();
  const currentUser = await getCurrentUserWithName();
  const userId = currentUser?.userId ?? null;
  const category = (await createWithLog(
    "category",
    {
      name: values.name,
      description: values.description,
      icon: values.icon,
      color: values.color,
      // createdBy: userId, // use id or name?
      createdBy: currentUser?.fullName ?? "System", // use id or name?
    },
    {
      userId,
      submodule: "", //manually add submodule for now
    },
  )) as { id: string };
  await realtime.emit("activity.created", {
    action: "create",
    module: "category",
    submodule: "",
    recordId: category.id,
    user: currentUser?.fullName ?? null,
    createdAt: new Date().toISOString(),
  });
  return { success: true, category };
}

export async function updateCategory(id: string, values: CategoryFormValues) {
  await requirePermission("category:update");
  values = categorySchema.parse(values);

  // const currentUser = await getCurrentUser();
  const currentUser = await getCurrentUserWithName();
  const userId = currentUser?.userId ?? null;
  if (!id) {
    throw new Error("Category ID is required for editing");
  }
  const existing = await prisma.category.findUnique({
    where: { id: id },
  });
  if (!existing) {
    throw new Error("Category not found");
  }

  const updatedCategory = (await updateWithLog(
    "category",
    { id },
    {
      name: values.name,
      icon: values.icon,
      color: values.color,
      description: values.description,
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
    module: "category",
    submodule: "",
    recordId: updatedCategory.id,
    user: currentUser?.fullName ?? null,
    createdAt: new Date().toISOString(),
  });
  return { success: true, updatedCategory };
}

export async function deleteCategory(id: string) {
  await requirePermission("category:delete");

  // const currentUser = await getCurrentUser();
  const currentUser = await getCurrentUserWithName();
  const userId = currentUser?.userId ?? null;
  if (!id) {
    throw new Error("Category ID is required for editing");
  }
  const existing = await prisma.category.findUnique({
    where: { id: id },
  });
  if (!existing) {
    throw new Error("Category not found");
  }

  const deletedCategory = (await deleteWithLog(
    "category",
    { id },
    { userId, submodule: "" },
  )) as { id: string };
  await realtime.emit("activity.created", {
    action: "delete",
    module: "category",
    submodule: "",
    recordId: deletedCategory.id,
    user: currentUser?.fullName ?? null,
    createdAt: new Date().toISOString(),
  });
  return { success: true, deletedCategory };
}
