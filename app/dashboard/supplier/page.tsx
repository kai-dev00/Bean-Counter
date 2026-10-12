import { getCurrentUserWithDetails } from "@/lib/auth";
import prisma from "@/lib/prisma";
import SupplierClient from "./SupplierClient";
import { requirePermission } from "@/lib/auth-guard";

export default async function SupplierPage() {
  await requirePermission("supplier:read");

  const suppliers = await prisma.supplier.findMany({
    orderBy: { updatedAt: "desc" },
  });

  const permissionData = await getCurrentUserWithDetails();
  const permissions = permissionData?.role?.permissions || [];

  return <SupplierClient suppliers={suppliers} permissions={permissions} />;
}

export const metadata = { title: "Suppliers" };
