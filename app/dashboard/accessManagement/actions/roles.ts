"use server";

import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-guard";
import { revalidatePath } from "next/cache";
import { getCurrentUserWithName } from "@/lib/auth";
import {
  createWithLog,
  deleteWithLog,
  updateWithLog,
} from "@/lib/types/prismaLogger";
import { realtime } from "@/lib/upstash/realtime";
import { RoleFormValues, roleSchema } from "../schema";

// Create Action
export async function createRoleAction(data: RoleFormValues) {
  await requirePermission("access-management:create:roles");

  const validated = roleSchema.parse(data);

  const existing = await prisma.role.findUnique({
    where: { name: validated.name },
  });

  if (existing) {
    throw new Error("Role with this name already exists");
  }
  const currentUser = await getCurrentUserWithName();
  const userId = currentUser?.userId ?? null;
  const newRole = (await createWithLog(
    "role",
    {
      name: validated.name,
      description: validated.description,
      permissions: {
        connect: validated.permissionIds.map((id) => ({ id })),
      },
    },
    {
      userId,
      submodule: "roles",
    },
    {
      include: { permissions: true },
    },
  )) as { id: string };

  await realtime.emit("activity.created", {
    action: "create",
    module: "access-management",
    submodule: "roles",
    recordId: newRole.id,
    user: currentUser?.fullName ?? null,
    createdAt: new Date().toISOString(),
  });

  revalidatePath("/roles");
  return newRole;
}

// Update Action
export async function updateRoleAction(id: string, data: RoleFormValues) {
  await requirePermission("access-management:update:roles");

  const validated = roleSchema.parse(data);

  const existing = await prisma.role.findFirst({
    where: {
      name: validated.name,
      NOT: { id },
    },
  });

  if (existing) {
    throw new Error("Role with this name already exists");
  }

  const currentUser = await getCurrentUserWithName();
  const userId = currentUser?.userId ?? null;

  const updatedRole = (await updateWithLog(
    "role",
    { id },
    {
      name: validated.name,
      description: validated.description,
      updatedBy: currentUser?.fullName ?? "System",
      updatedAt: new Date(),
      permissions: {
        set: validated.permissionIds.map((id) => ({ id })),
      },
    },
    {
      userId,
      submodule: "roles",
    },
    {
      include: { permissions: true },
    },
  )) as { id: string };

  await realtime.emit("activity.created", {
    action: "update",
    module: "access-management",
    submodule: "roles",
    recordId: updatedRole.id,
    user: currentUser?.fullName ?? null,
    createdAt: new Date().toISOString(),
  });

  revalidatePath("/roles");
  revalidatePath(`/roles/${id}/edit`);

  return updatedRole;
}

// Delete Action
export async function deleteRoleAction(id: string) {
  await requirePermission("access-management:delete:roles");

  const currentUser = await getCurrentUserWithName();
  const currentUserRoleId = currentUser?.roleId;
  const userId = currentUser?.userId ?? null;

  const roleToDelete = await prisma.role.findUnique({
    where: { id },
    include: { permissions: true },
  });

  if (!roleToDelete) throw new Error("Role not found");

  if (id === currentUserRoleId) {
    throw new Error("You cannot delete role that has been assigned to you.");
  }

  const usersCount = await prisma.user.count({ where: { roleId: id } });
  if (usersCount > 0)
    throw new Error(`Cannot delete role. ${usersCount} user(s) are assigned.`);

  const invitesCount = await prisma.userInvite.count({ where: { roleId: id } });
  if (invitesCount > 0)
    throw new Error(
      `Cannot delete role. ${invitesCount} invite(s) are assigned.`,
    );

  await prisma.role.update({
    where: { id },
    data: { permissions: { set: [] } },
  });

  const deletedRole = await deleteWithLog(
    "role",
    { id },
    { userId, submodule: "roles" },
    { before: roleToDelete },
  );

  await realtime.emit("activity.created", {
    action: "delete",
    module: "access-management",
    submodule: "roles",
    recordId: id,
    user: currentUser?.fullName ?? null,
    createdAt: new Date().toISOString(),
  });

  revalidatePath("/roles");
  return deletedRole;
}

export async function getRolesCount() {
  await requirePermission("access-management:read:roles");

  return await prisma.role.findMany({
    include: {
      permissions: true,
      _count: {
        select: { users: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getRoleById(id: string) {
  await requirePermission("access-management:read:roles");

  return await prisma.role.findUnique({
    where: { id },
    include: {
      permissions: true,
    },
  });
}

export async function getAllPermissions() {
  await requirePermission("access-management:read:roles");

  return await prisma.permission.findMany({
    orderBy: [{ module: "asc" }, { action: "asc" }],
  });
}
