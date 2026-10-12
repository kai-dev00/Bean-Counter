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
import { emitActivity } from "@/lib/upstash/realtime";
import { RoleFormValues, roleSchema } from "../schema";
import { ActionError, ActionResult, runAction } from "@/lib/action-result";

const ROLES_PATH = "/dashboard/accessManagement/roles";
const DUPLICATE_NAME = "Role with this name already exists";

// Create Action
export async function createRoleAction(
  data: RoleFormValues,
): Promise<ActionResult> {
  await requirePermission("access-management:create:roles");

  return runAction(
    async () => {
      const validated = roleSchema.parse(data);

      const existing = await prisma.role.findUnique({
        where: { name: validated.name },
      });

      if (existing) {
        throw new ActionError(DUPLICATE_NAME);
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
          module: "access-management",
          submodule: "roles",
        },
        {
          include: { permissions: true },
        },
      )) as { id: string };

      await emitActivity({
        action: "create",
        module: "access-management",
        submodule: "roles",
        recordId: newRole.id,
        user: currentUser?.fullName ?? null,
        createdAt: new Date().toISOString(),
      });

      revalidatePath(ROLES_PATH);
    },
    { P2002: DUPLICATE_NAME },
  );
}

// Update Action
export async function updateRoleAction(
  id: string,
  data: RoleFormValues,
): Promise<ActionResult> {
  await requirePermission("access-management:update:roles");

  return runAction(
    async () => {
      const validated = roleSchema.parse(data);

      const existing = await prisma.role.findFirst({
        where: {
          name: validated.name,
          NOT: { id },
        },
      });

      if (existing) {
        throw new ActionError(DUPLICATE_NAME);
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
          module: "access-management",
          submodule: "roles",
        },
        {
          include: { permissions: true },
        },
      )) as { id: string };

      await emitActivity({
        action: "update",
        module: "access-management",
        submodule: "roles",
        recordId: updatedRole.id,
        user: currentUser?.fullName ?? null,
        createdAt: new Date().toISOString(),
      });

      revalidatePath(ROLES_PATH);
      revalidatePath(`${ROLES_PATH}/${id}/edit`);
    },
    { P2002: DUPLICATE_NAME },
  );
}

// Delete Action
export async function deleteRoleAction(id: string): Promise<ActionResult> {
  await requirePermission("access-management:delete:roles");

  return runAction(
    async () => {
      const currentUser = await getCurrentUserWithName();
      const currentUserRoleId = currentUser?.roleId;
      const userId = currentUser?.userId ?? null;

      const roleToDelete = await prisma.role.findUnique({
        where: { id },
        include: { permissions: true },
      });

      if (!roleToDelete) throw new ActionError("Role not found");

      if (id === currentUserRoleId) {
        throw new ActionError(
          "You cannot delete role that has been assigned to you.",
        );
      }

      const usersCount = await prisma.user.count({ where: { roleId: id } });
      if (usersCount > 0)
        throw new ActionError(
          `Cannot delete role. ${usersCount} user(s) are assigned.`,
        );

      const invitesCount = await prisma.userInvite.count({
        where: { roleId: id },
      });
      if (invitesCount > 0)
        throw new ActionError(
          `Cannot delete role. ${invitesCount} invite(s) are assigned.`,
        );

      // Unlinking permissions and deleting the role succeed or fail together
      await prisma.$transaction(async (tx) => {
        await tx.role.update({
          where: { id },
          data: { permissions: { set: [] } },
        });

        await deleteWithLog(
          "role",
          { id },
          { userId, module: "access-management", submodule: "roles", tx },
          { before: roleToDelete },
        );
      });

      await emitActivity({
        action: "delete",
        module: "access-management",
        submodule: "roles",
        recordId: id,
        user: currentUser?.fullName ?? null,
        createdAt: new Date().toISOString(),
      });

      revalidatePath(ROLES_PATH);
    },
    {
      // A user or invite was assigned between the checks above and the delete
      P2003: "This role is still assigned to users or invites.",
    },
  );
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
