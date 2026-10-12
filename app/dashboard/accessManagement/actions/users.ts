"use server";

import prisma from "@/lib/prisma";
import { randomBytes } from "crypto";
import { UserFormValues, userFormSchema } from "../schema";
import { sendInviteEmail } from "@/lib/email";
import { requirePermission } from "@/lib/auth-guard";
import { getCurrentUserWithName } from "@/lib/auth";
import {
  createWithLog,
  deleteWithLog,
  updateWithLog,
} from "@/lib/types/prismaLogger";
import { emitActivity } from "@/lib/upstash/realtime";
import { ActionError, ActionResult, runAction } from "@/lib/action-result";

const MODULE = "access-management";

// Invite Action
export async function inviteUserAction(
  input: UserFormValues,
): Promise<ActionResult> {
  await requirePermission("access-management:create:users");

  return runAction(
    async () => {
      input = userFormSchema.parse(input);
      const currentUser = await getCurrentUserWithName();
      const userId = currentUser?.userId ?? null;
      if (!input.firstName?.trim()) {
        throw new ActionError("First name is required");
      }
      if (!input.lastName?.trim()) {
        throw new ActionError("Last name is required");
      }
      if (!input.email) {
        throw new ActionError("Email is required");
      }
      if (!input.roleId) {
        throw new ActionError("Role is required");
      }
      const email = input.email;

      // Check if user already exists
      const exists = await prisma.user.findUnique({
        where: { email },
      });

      if (exists) throw new ActionError("User already exists");

      const existingInvitedUser = await prisma.userInvite.findUnique({
        where: { email },
      });

      if (existingInvitedUser) {
        throw new ActionError(
          "An invitation has already been sent to this email",
        );
      }

      const token = randomBytes(32).toString("hex");

      // Set expiry, e.g., 7 days from now
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      // Sending the email inside the transaction means a failed send rolls
      // the invite back, instead of leaving an invite nobody received
      const invite = await prisma.$transaction(
        async (tx) => {
          const created = (await createWithLog(
            "userInvite",
            {
              createdBy: currentUser?.fullName ?? "System",
              email,
              firstName: input.firstName,
              lastName: input.lastName,
              roleId: input.roleId,
              token,
              expiresAt,
            },
            { userId, module: MODULE, submodule: "users", tx },
          )) as { id: string };

          await sendInviteEmail(email, token);
          return created;
        },
        { timeout: 15_000 }, // SMTP can take a few seconds
      );

      await emitActivity({
        action: "create",
        module: MODULE,
        submodule: "users",
        recordId: invite.id,
        user: currentUser?.fullName ?? null,
        createdAt: new Date().toISOString(),
      });
    },
    {
      P2002: "An invitation has already been sent to this email",
      P2003: "The selected role no longer exists.",
    },
  );
}

//Edit Action
export async function editUserAction(
  input: UserFormValues,
): Promise<ActionResult> {
  await requirePermission("access-management:update:users");

  return runAction(
    async () => {
      input = userFormSchema.parse(input);

      const currentUser = await getCurrentUserWithName();
      const userId = currentUser?.userId ?? null;

      if (!input.id) {
        throw new ActionError("User ID is required for editing");
      }

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: input.id },
      });

      const invite = await prisma.userInvite.findUnique({
        where: { id: input.id },
      });

      if (!user && !invite) {
        throw new ActionError("User or invite not found");
      }

      if (user) {
        // Update user
        await updateWithLog(
          "user",
          { id: input.id },
          {
            email: input.email,
            firstName: user.firstName,
            lastName: user.lastName,
            fullName: `${user.firstName} ${user.lastName}`,
            roleId: input.roleId,
            isActive: input.isActive,
            updatedBy: currentUser?.fullName ?? "System",
            updatedAt: new Date(),
          },
          { userId, module: MODULE, submodule: "users" },
        );

        await emitActivity({
          action: "update",
          module: MODULE,
          submodule: "users",
          recordId: user.id,
          user: currentUser?.fullName ?? null,
          createdAt: new Date().toISOString(),
        });
      } else if (invite) {
        // Update invite
        await updateWithLog(
          "userInvite",
          { id: input.id },
          {
            email: input.email,
            firstName: invite.firstName,
            lastName: invite.lastName,
            roleId: input.roleId,
            updatedBy: currentUser?.fullName ?? "System",
            updatedAt: new Date(),
          },
          { userId, module: MODULE, submodule: "users" },
        );

        await emitActivity({
          action: "update",
          module: MODULE,
          submodule: "users",
          recordId: invite.id,
          user: currentUser?.fullName ?? null,
          createdAt: new Date().toISOString(),
        });
      }
    },
    {
      P2002: "This email is already in use.",
      P2003: "The selected role no longer exists.",
    },
  );
}

// Delete Action
export async function deleteAccessAction(
  id: string,
  source: "USER" | "INVITE",
): Promise<ActionResult> {
  await requirePermission("access-management:delete:users");

  return runAction(
    async () => {
      const currentUser = await getCurrentUserWithName();
      const userId = currentUser?.userId ?? null;

      if (!currentUser) throw new ActionError("Unauthorized.");
      if (id === userId)
        throw new ActionError("You cannot delete your own account.");

      if (source === "USER") {
        const existing = await prisma.user.findUnique({ where: { id } });
        if (!existing) throw new ActionError("User not found");

        await deleteWithLog(
          "user",
          { id },
          { userId, module: MODULE, submodule: "users" },
        );
      } else if (source === "INVITE") {
        const existing = await prisma.userInvite.findUnique({ where: { id } });
        if (!existing) throw new ActionError("Invite not found");

        await deleteWithLog(
          "userInvite",
          { id },
          { userId, module: MODULE, submodule: "users" },
        );
      } else {
        throw new ActionError("Invalid source");
      }

      await emitActivity({
        action: "delete",
        module: MODULE,
        submodule: "users",
        recordId: id,
        user: currentUser?.fullName ?? null,
        createdAt: new Date().toISOString(),
      });
    });
}

export async function getUsers() {
  await requirePermission("access-management:read:users");

  return await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      fullName: true,
      isActive: true,
      emailVerifiedAt: true,
      createdAt: true,
      createdBy: true,
      updatedBy: true,
      updatedAt: true,
      role: {
        select: {
          name: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getInvites() {
  await requirePermission("access-management:read:users");

  return await prisma.userInvite.findMany({
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      expiresAt: true,
      usedAt: true,
      createdAt: true,
      createdBy: true,
      updatedBy: true,
      updatedAt: true,
      role: {
        select: { name: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getRoles() {
  await requirePermission("access-management:read:users");

  return await prisma.role.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: { name: "asc" },
  });
}
