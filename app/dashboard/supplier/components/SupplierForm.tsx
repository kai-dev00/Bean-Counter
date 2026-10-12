"use client";

import { unwrap } from "@/lib/unwrap-action";
import { Supplier } from "@/app/generated/prisma/browser";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import CustomButton from "@/components/CustomButton";
import { useRouter } from "next/navigation";
import { showToast } from "@/lib/toast";
import { CustomInput } from "@/components/CustomInput";
import { SupplierFormValues, supplierSchema } from "../schema";
import { createSupplier, updateSupplier } from "../actions";

type SupplierFormProps = {
  supplier: Supplier | null;
  onSuccess: () => void;
};

export default function SupplierForm({
  supplier,
  onSuccess,
}: SupplierFormProps) {
  const router = useRouter();

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: supplier?.name ?? "",
      email: supplier?.email ?? "",
      phone: supplier?.phone ?? "",
      address: supplier?.address ?? "",
      notes: supplier?.notes ?? "",
    },
  });

  const { handleSubmit, formState } = form;

  const onSubmit = async (values: SupplierFormValues) => {
    try {
      if (supplier) {
        await unwrap(updateSupplier(supplier.id, values));
        showToast.success("Supplier successfully updated");
      } else {
        await unwrap(createSupplier(values));
        showToast.success("Supplier successfully created");
      }

      router.refresh();
      onSuccess();
    } catch (err) {
      showToast.error("Something went wrong", (err as Error).message);
    }
  };

  const isEditMode = Boolean(supplier);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <CustomInput
        label="Name"
        required={!isEditMode}
        error={form.formState.errors.name?.message}
        {...form.register("name")}
      />

      <CustomInput
        label="Email"
        required={!isEditMode}
        error={form.formState.errors.email?.message}
        {...form.register("email")}
      />
      <CustomInput
        label="Phone Number"
        required={!isEditMode}
        error={form.formState.errors.phone?.message}
        {...form.register("phone")}
      />
      <CustomInput
        label="Address"
        required={!isEditMode}
        error={form.formState.errors.address?.message}
        {...form.register("address")}
      />
      <CustomInput
        label="Notes"
        multiline={true}
        error={form.formState.errors.notes?.message}
        {...form.register("notes")}
      />

      <div className="flex w-full justify-end">
        <CustomButton type="submit" loading={formState.isSubmitting}>
          {supplier ? "Update Supplier" : "Create Supplier"}
        </CustomButton>
      </div>
    </form>
  );
}
