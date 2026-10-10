"use client";

import { Permission } from "@/lib/types";
import { PageCard } from "@/components/PageCard";
import NoPermission from "../no-permission";
import { usePermission } from "@/lib/permissions/usePermission";
import {
  Category,
  InventoryUnit,
  Prisma,
} from "@/app/generated/prisma/browser";
import CustomButton from "@/components/CustomButton";
import InventoryTable from "./components/inventoryTable";
import { useState } from "react";
import { CustomModal } from "@/components/CustomModal";
import InventoryForm from "./components/inventoryForm";
import z from "zod";
import { AlertTriangle, Package, XCircle } from "lucide-react";
import { StatsCard } from "@/components/StatsCard";

export const inventorySchema = z.object({
  name: z.string().min(1, "Required").max(50),
  description: z.string().optional(),
  quantity: z.number({ message: "Required" }).min(0, "Required"),
  minimumStock: z.number({ message: "Required" }).min(0, "Required"),
  unitPrice: z.number({ message: "Required" }).min(0, "Required"),
  unit: z.nativeEnum(InventoryUnit),
  categoryId: z.string().min(1, "Required"),
  discontinued: z.boolean(),
});
export type InventoryFormValues = z.infer<typeof inventorySchema>;

export type InventoryCreatePayload = Omit<
  InventoryFormValues,
  "quantity" | "minimumStock" | "unitPrice"
> & {
  quantity: number;
  minimumStock: number | null;
  unitPrice: number;
};

export type InventoryWithCategory = Omit<
  Prisma.InventoryGetPayload<{ include: { category: true } }>,
  "quantity" | "minimumStock" | "unitPrice"
> & {
  quantity: number;
  minimumStock: number | null;
  unitPrice: number;
};

export type PurchaseHistoryItem = {
  id: string;
  purchaseId: string;
  inventoryId: string;
  quantity: number;
  unitCost: number;
  purchase: {
    id: string;
    status: string;
    total: number;
    createdAt: string;
    updatedAt: string | null;
    supplier: { name: string };
  };
};

type Props = {
  inventories: InventoryWithCategory[];
  categories: Category[];
  permissions: Permission[];
  defaultSearch?: string;
  purchaseHistory: PurchaseHistoryItem[];
};

export default function InventoryClient({
  inventories,
  categories,
  permissions,
  defaultSearch,
  purchaseHistory,
}: Props) {
  const { can } = usePermission(permissions);
  if (!can("inventory:read")) return <NoPermission />;

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryWithCategory | null>(null);

  const openCreate = () => {
    setEditing(null);
    setOpen(true);
  };

  const openEdit = (inventory: InventoryWithCategory) => {
    setEditing(inventory);
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setTimeout(() => setEditing(null), 200);
  };

  //status card filters
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const toggleFilter = (status: string) => {
    setStatusFilter((prev) => (prev === status ? null : status));
  };

  const filteredInventoriesByStatus = statusFilter
    ? inventories.filter((item) => item.status === statusFilter)
    : inventories;

  return (
    <PageCard>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <StatsCard
          title="Total Inventory"
          value={inventories.length.toString()}
          icon={Package}
          description="Across all categories"
          onClick={() => setStatusFilter(null)}
          active={statusFilter === null}
          color="default"
        />

        <StatsCard
          title="Low Stock Items"
          value={inventories
            .filter((item) => item.status === "low_stock")
            .length.toString()}
          icon={AlertTriangle}
          trend={{ value: -5, label: "from last week" }}
          onClick={() => toggleFilter("low_stock")}
          active={statusFilter === "low_stock"}
          color="warning"
        />

        <StatsCard
          title="Out of Stock"
          value={inventories
            .filter((inv) => inv.status === "out_of_stock")
            .length.toString()}
          icon={XCircle}
          trend={{ value: 2 }}
          onClick={() => toggleFilter("out_of_stock")}
          active={statusFilter === "out_of_stock"}
          color="danger"
        />
      </div>
      <InventoryTable
        inventories={filteredInventoriesByStatus}
        defaultSearch={defaultSearch}
        categories={categories}
        onEdit={openEdit}
        permissions={permissions}
        purchaseHistory={purchaseHistory}
        headerActions={
          can("inventory:create") && (
            <CustomButton onClick={openCreate}>Add Inventory</CustomButton>
          )
        }
      />

      <CustomModal
        open={open}
        onOpenChange={setOpen}
        title={editing ? "Edit Inventory" : "Add Inventory"}
      >
        <InventoryForm
          key={editing?.id ?? "new"}
          inventory={editing}
          onSuccess={closeModal}
          categories={categories}
        />
      </CustomModal>
    </PageCard>
  );
}
