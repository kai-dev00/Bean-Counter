// app/dashboard/reports/page.tsx
import prisma from "@/lib/prisma";
import { getCurrentUserWithDetails } from "@/lib/auth";
import ReportsClient from "./components/ReportClient";

export default async function ReportsPage() {
  const [rawInventories, rawPurchases, rawSupplierTotals, permissionData] =
    await Promise.all([
      prisma.inventory.findMany({
        include: { category: true },
        orderBy: { name: "asc" },
      }),
      prisma.purchase.findMany({
        where: { status: "RECEIVED" },
        include: {
          supplier: true,
          items: {
            include: { inventory: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.purchase.groupBy({
        by: ["supplierId"],
        where: { status: "RECEIVED" },
        _sum: { total: true },
        _count: { id: true },
      }),
      getCurrentUserWithDetails(),
    ]);

  // serialize inventories
  const inventories = rawInventories.map((inv) => ({
    ...inv,
    quantity: inv.quantity.toNumber(),
    unitPrice: inv.unitPrice.toNumber(),
    minimumStock: Number(inv.minimumStock),
    updatedAt: inv.updatedAt?.toISOString() ?? null,
  }));

  // serialize purchases
  const purchases = rawPurchases.map((p) => ({
    ...p,
    total: p.total.toNumber(),
    updatedAt: p.updatedAt?.toISOString() ?? null,
    createdAt: p.createdAt.toISOString(),
    items: p.items.map((item) => ({
      ...item,
      quantity: item.quantity.toNumber(),
      unitCost: item.unitCost.toNumber(),
      inventory: {
        ...item.inventory,
        quantity: item.inventory.quantity.toNumber(),
        unitPrice: item.inventory.unitPrice.toNumber(),
        minimumStock: Number(item.inventory.minimumStock),
        updatedAt: item.inventory.updatedAt?.toISOString() ?? null,
      },
    })),
  }));

  // get supplier names for groupBy results
  const supplierIds = rawSupplierTotals.map((s) => s.supplierId);
  const suppliers = await prisma.supplier.findMany({
    where: { id: { in: supplierIds } },
    select: { id: true, name: true },
  });

  const supplierTotals = rawSupplierTotals.map((s) => ({
    supplierId: s.supplierId,
    supplierName:
      suppliers.find((sup) => sup.id === s.supplierId)?.name ?? "Unknown",
    total: s._sum.total?.toNumber() ?? 0,
    orderCount: s._count.id,
  }));

  const permissions = permissionData?.role?.permissions ?? [];

  return (
    <ReportsClient
      inventories={inventories}
      purchases={purchases}
      supplierTotals={supplierTotals}
      permissions={permissions}
    />
  );
}

export const metadata = { title: "Reports" };
