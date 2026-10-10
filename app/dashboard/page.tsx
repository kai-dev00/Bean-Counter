import prisma from "@/lib/prisma";
import DashboardClient from "./_dashboard-components/dashboardClient";

const SPEND_MONTHS = 6;

export default async function DashboardPage() {
  const now = new Date();
  const spendStart = new Date(
    now.getFullYear(),
    now.getMonth() - (SPEND_MONTHS - 1),
    1,
  );

  const [
    rawInventories,
    categories,
    recentActivity,
    receivedPurchases,
    supplierSpend,
    draftPurchases,
  ] = await Promise.all([
    prisma.inventory.findMany({
      select: {
        id: true,
        name: true,
        quantity: true,
        minimumStock: true,
        unitPrice: true,
        unit: true,
        status: true,
        categoryId: true,
      },
    }),
    prisma.category.findMany({
      select: { id: true, name: true, color: true },
    }),
    prisma.actionLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { user: { select: { fullName: true } } },
    }),
    prisma.purchase.findMany({
      where: { status: "RECEIVED", createdAt: { gte: spendStart } },
      select: { total: true, createdAt: true },
    }),
    prisma.purchase.groupBy({
      by: ["supplierId"],
      where: { status: "RECEIVED" },
      _sum: { total: true },
      orderBy: { _sum: { total: "desc" } },
      take: 5,
    }),
    prisma.purchase.aggregate({
      where: { status: "DRAFT" },
      _count: true,
      _sum: { total: true },
    }),
  ]);

  const inventories = rawInventories.map((inv) => ({
    ...inv,
    quantity: inv.quantity.toNumber(),
    unitPrice: inv.unitPrice.toNumber(),
  }));

  // unitPrice is per unit (per g / pc / L), so value = quantity × unitPrice
  const totalInventoryValue = inventories.reduce(
    (sum, inv) => sum + inv.quantity * inv.unitPrice,
    0,
  );

  // Items at or near their minimum stock, worst first
  const reorderItems = inventories
    .filter(
      (inv) =>
        inv.status === "out_of_stock" ||
        inv.status === "warning" ||
        inv.status === "low_stock",
    )
    .map((inv) => ({
      id: inv.id,
      name: inv.name,
      quantity: inv.quantity,
      minimumStock: inv.minimumStock,
      unit: inv.unit,
      status: inv.status,
    }))
    .sort(
      (a, b) =>
        a.quantity / Math.max(a.minimumStock, 1) -
        b.quantity / Math.max(b.minimumStock, 1),
    );

  // Inventory value per category
  const valueByCategoryId = new Map<string, number>();
  for (const inv of inventories) {
    valueByCategoryId.set(
      inv.categoryId,
      (valueByCategoryId.get(inv.categoryId) ?? 0) +
        inv.quantity * inv.unitPrice,
    );
  }
  const categoryValues = categories
    .map((c) => ({
      name: c.name,
      color: c.color,
      value: valueByCategoryId.get(c.id) ?? 0,
    }))
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value);

  // Received purchase spend per month (oldest → newest)
  const monthlySpend = Array.from({ length: SPEND_MONTHS }, (_, i) => {
    const date = new Date(spendStart.getFullYear(), spendStart.getMonth() + i);
    return {
      key: `${date.getFullYear()}-${date.getMonth()}`,
      month: date.toLocaleDateString("en-US", { month: "short" }),
      total: 0,
    };
  });
  for (const p of receivedPurchases) {
    const bucket = monthlySpend.find(
      (m) => m.key === `${p.createdAt.getFullYear()}-${p.createdAt.getMonth()}`,
    );
    if (bucket) bucket.total += p.total.toNumber();
  }

  const spendThisMonth = monthlySpend[SPEND_MONTHS - 1].total;
  const spendLastMonth = monthlySpend[SPEND_MONTHS - 2].total;
  const spendTrend =
    spendLastMonth > 0
      ? Math.round(((spendThisMonth - spendLastMonth) / spendLastMonth) * 100)
      : null;

  // Top suppliers by received spend
  const supplierNames = await prisma.supplier.findMany({
    where: { id: { in: supplierSpend.map((s) => s.supplierId) } },
    select: { id: true, name: true },
  });
  const topSuppliers = supplierSpend.map((s) => ({
    name: supplierNames.find((n) => n.id === s.supplierId)?.name ?? "Unknown",
    total: s._sum.total?.toNumber() ?? 0,
  }));

  const serializedActivity = recentActivity.map((a) => ({
    ...a,
    createdAt: a.createdAt.toISOString(),
  }));

  return (
    <DashboardClient
      totalInventoryValue={totalInventoryValue}
      lowStockCount={reorderItems.length}
      spendThisMonth={spendThisMonth}
      spendTrend={spendTrend}
      pendingPurchases={{
        count: draftPurchases._count,
        total: draftPurchases._sum.total?.toNumber() ?? 0,
      }}
      monthlySpend={monthlySpend.map(({ month, total }) => ({ month, total }))}
      categoryValues={categoryValues}
      topSuppliers={topSuppliers}
      reorderItems={reorderItems}
      recentActivity={serializedActivity}
      inventories={inventories.map((inv) => ({ status: inv.status }))}
    />
  );
}

export const metadata = { title: "Dashboard" };
