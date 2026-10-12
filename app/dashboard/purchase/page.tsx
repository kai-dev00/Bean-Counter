import { getCurrentUserWithDetails } from "@/lib/auth";
import prisma from "@/lib/prisma";
import PurchaseClient from "./components/PurchaseClient";
import { requirePermission } from "@/lib/auth-guard";

export default async function PurchasesPage() {
  await requirePermission("purchase:read");

  const [rawPurchases, suppliers, rawInventories, permissionData] =
    await Promise.all([
      prisma.purchase.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          supplier: true,
          items: {
            include: {
              inventory: {
                select: { id: true, name: true, unit: true },
              },
            },
          },
        },
      }),
      prisma.supplier.findMany({ orderBy: { name: "asc" } }),
      prisma.inventory.findMany({
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          unit: true,
          unitPrice: true,
          status: true,
        },
      }),
      getCurrentUserWithDetails(),
    ]);

  const purchases = rawPurchases.map((p) => ({
    ...p,
    total: p.total.toNumber(),
    items: p.items.map((item) => ({
      ...item,
      quantity: item.quantity.toNumber(),
      unitCost: item.unitCost.toNumber(),
    })),
  }));

  const inventories = rawInventories.map((inv) => ({
    ...inv,
    unitPrice: inv.unitPrice.toNumber(),
  }));

  const permissions = permissionData?.role?.permissions ?? [];

  return (
    <PurchaseClient
      purchases={purchases}
      suppliers={suppliers}
      inventories={inventories}
      permissions={permissions}
    />
  );
}

export const metadata = { title: "Purchases" };
