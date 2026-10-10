import { getCurrentUserWithDetails } from "@/lib/auth";
import InventoryClient from "./InventoryClient";
import prisma from "@/lib/prisma";

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const { search } = await searchParams;
  const [rawInventories, categories, rawPurchaseHistory, permissionData] =
    await Promise.all([
      prisma.inventory.findMany({
        orderBy: { updatedAt: "desc" },
        include: { category: true },
      }),
      prisma.category.findMany({ orderBy: { id: "asc" } }),
      prisma.purchaseItem.findMany({
        include: {
          purchase: {
            include: { supplier: { select: { name: true } } },
          },
        },
        orderBy: { purchase: { createdAt: "desc" } },
      }),
      getCurrentUserWithDetails(),
    ]);

  const inventories = rawInventories.map((item) => ({
    ...item,
    quantity: item.quantity.toNumber(),
    minimumStock: item.minimumStock ? Number(item.minimumStock) : null,
    unitPrice: item.unitPrice.toNumber(),
  }));

  const purchaseHistory = rawPurchaseHistory.map((item) => ({
    ...item,
    quantity: item.quantity.toNumber(),
    unitCost: item.unitCost.toNumber(),
    purchase: {
      ...item.purchase,
      total: item.purchase.total.toNumber(),
      createdAt: item.purchase.createdAt.toISOString(),
      updatedAt: item?.purchase?.updatedAt
        ? item.purchase.updatedAt.toISOString()
        : null,
    },
  }));
  const permissions = permissionData?.role?.permissions || [];

  return (
    <InventoryClient
      inventories={inventories}
      categories={categories}
      permissions={permissions}
      defaultSearch={search ?? ""}
      purchaseHistory={purchaseHistory}
    />
  );
}

export const metadata = { title: "Inventory" };
