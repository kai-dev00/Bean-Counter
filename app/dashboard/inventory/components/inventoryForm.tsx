"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import CustomButton from "@/components/CustomButton";
import { useRouter } from "next/navigation";
import { showToast } from "@/lib/toast";
import { CustomInput } from "@/components/CustomInput";
import { createInventory, updateInventory } from "../actions";
import { inventorySchema, InventoryWithCategory } from "../InventoryClient";
import { InventoryFormValues } from "../InventoryClient";
import CustomDropdown from "@/components/CustomDropdown";

import { Category, InventoryUnit } from "@/app/generated/prisma/browser";
import { QuantityInput } from "./QantityInput";
import { formatPeso } from "../../utils";
import { Checkbox } from "@/components/ui/checkbox";

const unitOptions = Object.values(InventoryUnit).map((u) => ({
  label: u.toLowerCase(), // match how units show in the table (pcs, kg, ...)
  value: u,
}));

type InventoryFormProps = {
  inventory: InventoryWithCategory | null;
  categories: Category[];
  onSuccess: () => void;
};

export default function InventoryForm({
  inventory,
  categories,
  onSuccess,
}: InventoryFormProps) {
  const router = useRouter();

  const form = useForm<InventoryFormValues>({
    mode: "onChange",
    resolver: zodResolver(inventorySchema),
    defaultValues: {
      name: inventory?.name ?? "",
      description: inventory?.description ?? "",
      quantity: inventory?.quantity ?? undefined,
      minimumStock: inventory?.minimumStock ?? undefined,
      unitPrice: inventory?.unitPrice ?? undefined,
      unit: inventory?.unit ?? InventoryUnit.PCS,
      categoryId: inventory?.categoryId ?? "",
      discontinued: inventory?.status === "discontinued",
    },
  });

  const { handleSubmit, formState } = form;

  const onSubmit = async (values: InventoryFormValues) => {
    try {
      if (inventory) {
        await updateInventory(inventory.id, values);
        showToast.success("Inventory successfully updated");
      } else {
        await createInventory(values);
        showToast.success("Inventory successfully created");
      }

      router.refresh();
      onSuccess();
    } catch {
      showToast.error("Something went wrong");
    }
  };

  const isEditMode = Boolean(inventory);

  const unit = form.watch("unit").toLowerCase();
  const quantity = form.watch("quantity");
  const unitPrice = form.watch("unitPrice");
  const showTotalPreview =
    Number.isFinite(quantity) && Number.isFinite(unitPrice);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <CustomInput
        label="Item Name"
        error={form.formState.errors.name?.message}
        required={!isEditMode}
        {...form.register("name")}
      />
      <QuantityInput
        type="number"
        label="Quantity"
        required={!isEditMode}
        error={form.formState.errors.quantity?.message}
        unitValue={form.watch("unit")}
        onUnitChange={(val) =>
          form.setValue("unit", val as InventoryUnit, { shouldValidate: true })
        }
        unitOptions={unitOptions}
        {...form.register("quantity", { valueAsNumber: true })}
      />
      <CustomInput
        type="number"
        label="Minimum Stock"
        suffix={unit}
        className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        error={form.formState.errors.minimumStock?.message}
        required={!isEditMode}
        {...form.register("minimumStock", { valueAsNumber: true })}
      />
      <div className="space-y-1">
        <CustomInput
          type="number"
          label="Unit Price"
          prefix="₱"
          suffix={`/ ${unit}`}
          step="any"
          className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          onKeyDown={(e) => {
            if (
              !/[\d.]/.test(e.key) &&
              ![
                "Backspace",
                "Delete",
                "Tab",
                "ArrowLeft",
                "ArrowRight",
                "Decimal",
                ",",
              ].includes(e.key)
            ) {
              e.preventDefault();
            }
          }}
          error={form.formState.errors.unitPrice?.message}
          required={!isEditMode}
          {...form.register("unitPrice", { valueAsNumber: true })}
        />
        {showTotalPreview && (
          <p className="text-xs text-muted-foreground">
            Total value: {formatPeso(quantity * unitPrice)} ({quantity} {unit} ×{" "}
            {formatPeso(unitPrice)}/{unit})
          </p>
        )}
      </div>
      <CustomDropdown
        label="Category"
        placeholder="Select category"
        value={form.watch("categoryId")}
        onChange={(val) =>
          form.setValue("categoryId", val, { shouldValidate: true })
        }
        error={form.formState.errors.categoryId?.message}
        options={categories.map((cat) => ({
          label: cat.name,
          value: cat.id,
        }))}
        required={!isEditMode}
      />
      <CustomInput
        label="Description"
        multiline={true}
        error={form.formState.errors.description?.message}
        {...form.register("description")}
      />
      <label className="flex items-start gap-2 cursor-pointer">
        <Checkbox
          className="mt-0.5"
          checked={form.watch("discontinued")}
          onCheckedChange={(v) =>
            form.setValue("discontinued", Boolean(v), { shouldDirty: true })
          }
        />
        <span className="space-y-0.5">
          <span className="block text-sm font-medium">Discontinued</span>
          <span className="block text-xs text-muted-foreground">
            No longer stocked. Hidden from restock alerts and new purchases.
          </span>
        </span>
      </label>
      <div className="flex w-full justify-end">
        <CustomButton type="submit" loading={formState.isSubmitting}>
          {inventory ? "Update Inventory" : "Create Inventory"}
        </CustomButton>
      </div>
    </form>
  );
}
