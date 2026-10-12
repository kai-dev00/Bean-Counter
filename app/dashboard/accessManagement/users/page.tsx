import AccessManagementClient from "../components/AccessManagementClient";
import { getCurrentUserWithDetails } from "@/lib/auth";
import { getInvites, getRoles, getUsers } from "../actions/users";
import { requirePermission } from "@/lib/auth-guard";

export type UserRow = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName: string | null;
  role: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: Date;
  createdBy?: string;
  updatedBy?: string;
  updatedAt?: Date;
  status: "ACTIVE" | "PENDING" | "EXPIRED";
  source: "USER" | "INVITE";
};

export type RoleOption = {
  id: string;
  name: string;
};
//server component
export default async function AccessManagement({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  await requirePermission("access-management:read:users");

  const { search } = await searchParams;
  const permissionData = await getCurrentUserWithDetails();
  const permissions = permissionData?.role?.permissions || [];
  const users = await getUsers();
  const invites = await getInvites();
  const roles = await getRoles();
  const now = new Date();

  const userRows: UserRow[] = users.map((u) => ({
    id: u.id,
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    fullName: `${u.firstName} ${u.lastName}`,
    role: u.role.name,
    isActive: u.isActive,
    emailVerified: Boolean(u.emailVerifiedAt),
    createdAt: u.createdAt,
    createdBy: u.createdBy ?? undefined,
    updatedBy: u.updatedBy ?? undefined,
    updatedAt: u.updatedAt ?? undefined,
    status: "ACTIVE",
    source: "USER",
  }));

  const inviteRows: UserRow[] = invites.map((i) => ({
    id: i.id,
    email: i.email,
    fullName: `${i.firstName} ${i.lastName}`,
    role: i.role.name,
    isActive: false,
    emailVerified: false,
    createdAt: i.createdAt,
    createdBy: i.createdBy ?? undefined,
    updatedBy: i.updatedBy ?? undefined,
    updatedAt: i.updatedAt ?? undefined,
    status: i.usedAt ? "ACTIVE" : i.expiresAt < now ? "EXPIRED" : "PENDING",
    source: "INVITE",
  }));

  const rows: UserRow[] = [...userRows, ...inviteRows].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );

  return (
    <AccessManagementClient
      users={rows}
      roles={roles}
      permissions={permissions}
      defaultSearch={search ?? ""}
    />
  );
}

export const metadata = { title: "Users" };
