"use client";

import { Permission } from "@/lib/types";
import { PageCard } from "@/components/PageCard";
import NoPermission from "../no-permission";
import { usePermission } from "@/lib/permissions/usePermission";
import { Supplier } from "@/app/generated/prisma/browser";
import CustomButton from "@/components/CustomButton";
import { useState } from "react";
import { CustomModal } from "@/components/CustomModal";
import SupplierTable from "./components/SupplierTable";
import SupplierForm from "./components/SupplierForm";

type Props = {
  suppliers: Supplier[];
  permissions: Permission[];
  defaultSearch?: string;
};

export default function SupplierClient({
  suppliers,
  permissions,
  defaultSearch,
}: Props) {
  const { can } = usePermission(permissions);
  if (!can("supplier:read")) return <NoPermission />;

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);

  const openCreate = () => {
    setEditing(null);
    setOpen(true);
  };

  const openEdit = (supplier: Supplier) => {
    setEditing(supplier);
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setTimeout(() => setEditing(null), 200);
  };

  return (
    <PageCard>
      <SupplierTable
        suppliers={suppliers}
        defaultSearch={defaultSearch}
        onEdit={openEdit}
        permissions={permissions}
        headerActions={
          can("supplier:create") && (
            <CustomButton onClick={openCreate}>Add Supplier</CustomButton>
          )
        }
      />
      <CustomModal
        open={open}
        onOpenChange={setOpen}
        title={editing ? "Edit Supplier" : "Add Supplier"}
      >
        <SupplierForm
          key={editing?.id ?? "new"}
          supplier={editing}
          onSuccess={closeModal}
        />
      </CustomModal>
    </PageCard>
  );
}
