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
import { realtime } from "@/lib/upstash/realtime";

// Invite Action
export async function inviteUserAction(input: UserFormValues) {
  await requirePermission("access-management:create:users");
  input = userFormSchema.parse(input);
  const currentUser = await getCurrentUserWithName();
  const userId = currentUser?.userId ?? null;
  if (!input.firstName?.trim()) {
    throw new Error("First name is required");
  }
  if (!input.lastName?.trim()) {
    throw new Error("Last name is required");
  }
  if (!input.email) {
    throw new Error("Email is required");
  }
  if (!input.roleId) {
    throw new Error("Role is required");
  }
  // Check if user already exists
  const exists = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (exists) throw new Error("User already exists");

  const existingInvitedUser = await prisma.userInvite.findUnique({
    where: { email: input.email },
  });

  if (existingInvitedUser) {
    throw new Error("An invitation has already been sent to this email");
  }

  const token = randomBytes(32).toString("hex");

  // Set expiry, e.g., 7 days from now
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const invite = (await createWithLog(
    "userInvite",
    {
      createdBy: currentUser?.fullName ?? "System",
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      roleId: input.roleId,
      token,
      expiresAt,
    },
    {
      userId,
      submodule: "users",
    },
  )) as { id: string };

  await realtime.emit("activity.created", {
    action: "create",
    module: "access-management",
    submodule: "users",
    recordId: invite.id,
    user: currentUser?.fullName ?? null,
    createdAt: new Date().toISOString(),
  });

  await sendInviteEmail(input.email, token);
  return { success: true, token };
}

//Edit Action
export async function editUserAction(input: UserFormValues) {
  await requirePermission("access-management:update:users");
  input = userFormSchema.parse(input);

  const currentUser = await getCurrentUserWithName();
  const userId = currentUser?.userId ?? null;

  if (!input.id) {
    throw new Error("User ID is required for editing");
  }

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: input.id },
  });

  const invite = await prisma.userInvite.findUnique({
    where: { id: input.id },
  });

  if (!user && !invite) {
    throw new Error("User or invite not found");
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
      { userId, submodule: "users" },
    );

    await realtime.emit("activity.created", {
      action: "update",
      module: "access-management",
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
      { userId, submodule: "users" },
    );

    await realtime.emit("activity.created", {
      action: "update",
      module: "access-management",
      submodule: "users",
      recordId: invite.id,
      user: currentUser?.fullName ?? null,
      createdAt: new Date().toISOString(),
    });
  }

  return { success: true };
}

// Delete Action
export async function deleteAccessAction(
  id: string,
  source: "USER" | "INVITE",
) {
  await requirePermission("access-management:delete:users");

  const currentUser = await getCurrentUserWithName();
  const userId = currentUser?.userId ?? null;

  if (!currentUser) throw new Error("Unauthorized.");
  if (id === userId) throw new Error("You cannot delete your own account.");

  if (source === "USER") {
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) throw new Error("User not found");

    await deleteWithLog("user", { id }, { userId, submodule: "users" });

    await realtime.emit("activity.created", {
      action: "delete",
      module: "access-management",
      submodule: "users",
      recordId: id,
      user: currentUser?.fullName ?? null,
      createdAt: new Date().toISOString(),
    });
  } else if (source === "INVITE") {
    const existing = await prisma.userInvite.findUnique({ where: { id } });
    if (!existing) throw new Error("Invite not found");

    await deleteWithLog("userInvite", { id }, { userId, submodule: "users" });

    await realtime.emit("activity.created", {
      action: "delete",
      module: "access-management",
      submodule: "users",
      recordId: id,
      user: currentUser?.fullName ?? null,
      createdAt: new Date().toISOString(),
    });
  }

  return { success: true };
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
