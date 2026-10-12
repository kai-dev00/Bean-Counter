import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { Prisma, PrismaClient } from "@/app/generated/prisma/client";
import { InventoryUnit, PurchaseStatus } from "@/app/generated/prisma/enums";
import { computeInventoryStatus } from "@/app/dashboard/utils";
import { v4 as uuidv4 } from "uuid";

//data imports
import rolePermissions from "./data/permissions.json";
import usersData from "./data/users.json";
import rolesData from "./data/roles.json";
import invitesData from "./data/invites.json";
import categoriesData from "./data/categories.json";
import inventoriesData from "./data/inventories.json";
import suppliersData from "./data/suppliers.json";
import purchasesData from "./data/purchases.json";

// Create adapter with Pool (required for @prisma/adapter-pg)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

// "query" logging is very noisy with this much data; add it back to debug
const prisma = new PrismaClient({
  adapter,
  log: ["info", "warn", "error"],
});

const DAY = 24 * 60 * 60 * 1000;

// Dates in the data are relative ("daysAgo") so the dashboard charts always
// have recent data, whenever the seed runs
function daysAgo(days: number, hour = 9) {
  const d = new Date(Date.now() - days * DAY);
  d.setHours(hour, 0, 0, 0);
  return d;
}

async function main() {
  console.log("Starting seed...");
  console.log("DATABASE_URL:", process.env.DATABASE_URL);

  // Test connection
  await prisma.$connect();
  console.log("Database connected");

  console.log("----------------------------------------------");
  console.log("Seeding Permissions...");

  await prisma.permission.createMany({
    data: rolePermissions,
    skipDuplicates: true,
  });

  console.log("Seeding Permissions Done");
  console.log("----------------------------------------------");

  console.log("----------------------------------------------");
  console.log("Seeding Roles...");
  const permissions = await prisma.permission.findMany();
  const roleMap: Record<string, string> = {};
  for (const roleData of rolesData) {
    let rolePermissions;
    if (roleData.permissions === "all") {
      rolePermissions = permissions;
    } else if (roleData.permissions === "read_only") {
      rolePermissions = permissions.filter((p) => p.action === "read");
    } else {
      const { modules, extra } = roleData.permissions as {
        modules: string[];
        extra: { module: string; action: string; submodule?: string }[];
      };
      rolePermissions = permissions.filter(
        (p) =>
          modules.includes(p.module) ||
          extra.some(
            (e) =>
              e.module === p.module &&
              e.action === p.action &&
              (e.submodule ?? "") === (p.submodule ?? ""),
          ),
      );
      // Catch typos in roles.json: every listed module must exist
      const known = new Set(permissions.map((p) => p.module));
      const unknown = [...modules, ...extra.map((e) => e.module)].filter(
        (m) => !known.has(m),
      );
      if (unknown.length) {
        throw new Error(
          `roles.json: unknown module(s) for ${roleData.name}: ${unknown.join(", ")}`,
        );
      }
    }
    const role = await prisma.role.upsert({
      where: { name: roleData.name },
      update: {
        permissions: { set: rolePermissions.map((p) => ({ id: p.id })) },
      },
      create: {
        name: roleData.name,
        description: roleData.description,
        permissions: { connect: rolePermissions.map((p) => ({ id: p.id })) },
      },
    });
    roleMap[role.name] = role.id;
  }
  console.log("Seeding Roles Done");
  console.log("----------------------------------------------");

  console.log("----------------------------------------------");
  console.log("Seeding Users...");
  const userMap: Record<string, { id: string; fullName: string }> = {};
  for (const userData of usersData) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        id: uuidv4(),
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        fullName: userData.fullName,
        phoneNumber: userData.phoneNumber,
        password: hashedPassword,
        roleId: roleMap[userData.role],
        isActive: userData.isActive,
        emailVerifiedAt: new Date(),
        createdBy: "Seed",
      },
    });
    userMap[user.email] = { id: user.id, fullName: user.fullName ?? user.email };
  }
  console.log(`Seeding Users Done (${usersData.length})`);
  console.log("----------------------------------------------");

  console.log("----------------------------------------------");
  console.log("Seeding Invites...");
  for (const invite of invitesData) {
    // Skip anyone who already registered
    if (userMap[invite.email]) continue;
    await prisma.userInvite.upsert({
      where: { email: invite.email },
      update: {},
      create: {
        email: invite.email,
        firstName: invite.firstName,
        lastName: invite.lastName,
        roleId: roleMap[invite.role],
        token: randomBytes(32).toString("hex"),
        expiresAt: new Date(Date.now() + invite.expiresInDays * DAY),
        createdBy: userMap[invite.invitedBy]?.fullName ?? "Seed",
      },
    });
  }
  console.log(`Seeding Invites Done (${invitesData.length})`);
  console.log("----------------------------------------------");

  console.log("----------------------------------------------");
  console.log("Seeding Categories...");
  for (const cat of categoriesData) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: {
        name: cat.name,
        description: cat.description,
        icon: cat.icon,
        color: cat.color,
        createdBy: "Seed",
      },
    });
  }
  console.log(`Seeding Categories Done (${categoriesData.length})`);
  console.log("----------------------------------------------");

  console.log("----------------------------------------------");
  console.log("Seeding Inventories...");
  const categories = await prisma.category.findMany();
  const categoryIds = new Map(categories.map((c) => [c.name, c.id]));
  for (const inv of inventoriesData as {
    name: string;
    description: string;
    category: string;
    quantity: number;
    minimumStock: number;
    unitPrice: number;
    unit: string;
    discontinued?: boolean;
  }[]) {
    const categoryId = categoryIds.get(inv.category);
    if (!categoryId) {
      throw new Error(`inventories.json: unknown category "${inv.category}" for ${inv.name}`);
    }
    await prisma.inventory.upsert({
      where: { name: inv.name },
      update: {},
      create: {
        name: inv.name,
        description: inv.description,
        categoryId,
        quantity: inv.quantity,
        minimumStock: inv.minimumStock,
        unitPrice: inv.unitPrice,
        unit: inv.unit as InventoryUnit,
        // Same rule the app uses, so seeded statuses match what it would show
        status: computeInventoryStatus(
          inv.quantity,
          inv.minimumStock,
          inv.discontinued ?? false,
        ),
        createdBy: "Seed",
      },
    });
  }
  console.log(`Seeding Inventories Done (${inventoriesData.length})`);
  console.log("----------------------------------------------");

  console.log("----------------------------------------------");
  console.log("Seeding Suppliers...");
  for (const sup of suppliersData) {
    await prisma.supplier.upsert({
      where: { name: sup.name },
      update: {},
      create: {
        name: sup.name,
        email: sup.email,
        phone: sup.phone,
        address: sup.address,
        notes: sup.notes,
        createdBy: "Seed",
      },
    });
  }
  console.log(`Seeding Suppliers Done (${suppliersData.length})`);
  console.log("----------------------------------------------");

  console.log("----------------------------------------------");
  console.log("Seeding Purchases...");
  // Purchases have no unique key to upsert on, so only seed an empty table
  if ((await prisma.purchase.count()) > 0) {
    console.log("Purchases already exist, skipping");
  } else {
    const suppliers = await prisma.supplier.findMany();
    const supplierIds = new Map(suppliers.map((s) => [s.name, s.id]));
    const inventories = await prisma.inventory.findMany();
    const inventoryIds = new Map(inventories.map((i) => [i.name, i.id]));

    for (const p of purchasesData as {
      supplier: string;
      status: string;
      daysAgo: number;
      createdBy: string;
      notes?: string;
      items: { inventory: string; quantity: number; unitCost: number }[];
    }[]) {
      const supplierId = supplierIds.get(p.supplier);
      if (!supplierId) {
        throw new Error(`purchases.json: unknown supplier "${p.supplier}"`);
      }
      const items = p.items.map((item) => {
        const inventoryId = inventoryIds.get(item.inventory);
        if (!inventoryId) {
          throw new Error(`purchases.json: unknown inventory "${item.inventory}"`);
        }
        return { inventoryId, quantity: item.quantity, unitCost: item.unitCost };
      });

      const author = userMap[p.createdBy];
      const createdAt = daysAgo(p.daysAgo);
      // Received/cancelled a couple of days after ordering (never in the future)
      const closedAt = new Date(Math.min(createdAt.getTime() + 2 * DAY, Date.now()));
      const isClosed = p.status !== "DRAFT";
      const total = items.reduce((sum, i) => sum + i.quantity * i.unitCost, 0);

      // Seeded inventory quantities are the current stock, so receiving
      // these historical purchases doesn't add to it again
      const purchase = await prisma.purchase.create({
        data: {
          supplierId,
          status: p.status as PurchaseStatus,
          notes: p.notes,
          total,
          createdAt,
          createdBy: author?.fullName ?? "Seed",
          updatedAt: isClosed ? closedAt : null,
          updatedBy: isClosed ? (author?.fullName ?? "Seed") : null,
          items: { create: items },
        },
      });

      // Audit trail, so the dashboard's recent activity isn't empty
      const snapshot = {
        id: purchase.id,
        supplierId,
        total,
        notes: p.notes ?? null,
      } as Prisma.InputJsonObject;
      await prisma.actionLog.create({
        data: {
          userId: author?.id ?? null,
          module: "purchase",
          submodule: "",
          action: "create",
          recordId: purchase.id,
          before: Prisma.JsonNull,
          after: { ...snapshot, status: "DRAFT" },
          createdAt,
        },
      });
      if (isClosed) {
        await prisma.actionLog.create({
          data: {
            userId: author?.id ?? null,
            module: "purchase",
            submodule: "",
            action: "update",
            recordId: purchase.id,
            before: { ...snapshot, status: "DRAFT" },
            after: { ...snapshot, status: p.status },
            createdAt: closedAt,
          },
        });
      }
    }
    console.log(`Seeding Purchases Done (${purchasesData.length})`);
  }
  console.log("----------------------------------------------");

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error("Seeding failed:");
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    console.log("Disconnecting...");
    await prisma.$disconnect();
    await pool.end();
  });
