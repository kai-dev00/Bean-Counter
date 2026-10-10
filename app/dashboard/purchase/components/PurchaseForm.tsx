"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import CustomButton from "@/components/CustomButton";
import { CustomInput } from "@/components/CustomInput";
import { useRouter } from "next/navigation";
import { showToast } from "@/lib/toast";
import { Supplier } from "@/app/generated/prisma/browser";
import { createPurchase, updatePurchase } from "../actions";
import { Trash2, Plus } from "lucide-react";
import { formatPeso } from "../../utils";
import { PurchaseFormValues, purchaseSchema } from "../schema";
import { InventoryOption, PurchaseWithDetails } from "./PurchaseClient";
import CustomDropdown from "@/components/CustomDropdown";

type Props = {
  purchase: PurchaseWithDetails | null;
  suppliers: Supplier[];
  inventories: InventoryOption[];
  onSuccess: () => void;
};

export default function PurchaseForm({
  purchase,
  suppliers,
  inventories,
  onSuccess,
}: Props) {
  const router = useRouter();

  const form = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      supplierId: purchase?.supplierId ?? "",
      notes: purchase?.notes ?? "",
      items: purchase?.items.map((item) => ({
        inventoryId: item.inventoryId,
        quantity: item.quantity,
        unitCost: item.unitCost,
      })) ?? [{ inventoryId: "", quantity: 1, unitCost: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchedItems = form.watch("items");

  const lineTotal = (index: number) => {
    const item = watchedItems[index];
    return (item?.quantity ?? 0) * (item?.unitCost ?? 0);
  };

  const grandTotal = watchedItems.reduce(
    (sum, item) => sum + (item?.quantity ?? 0) * (item?.unitCost ?? 0),
    0,
  );

  const onSubmit = async (values: PurchaseFormValues) => {
    try {
      if (purchase) {
        await updatePurchase(purchase.id, values);
        showToast.success("Purchase updated");
      } else {
        await createPurchase(values);
        showToast.success("Purchase created");
      }
      router.refresh();
      onSuccess();
    } catch (err: any) {
      showToast.error("Something went wrong", err?.message);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {/* Supplier */}

      <CustomDropdown
        label="Supplier"
        placeholder="Select supplier"
        required
        value={form.watch("supplierId")}
        onChange={(val) =>
          form.setValue("supplierId", val, { shouldValidate: true })
        }
        error={form.formState.errors.supplierId?.message}
        options={suppliers.map((s) => ({
          label: s.name,
          value: s.id,
        }))}
      />

      {/* Notes */}
      <CustomInput
        label="Notes"
        placeholder="Optional notes"
        multiline
        error={form.formState.errors.notes?.message}
        {...form.register("notes")}
      />

      {/* Items */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">
            Items <span className="text-destructive">*</span>
          </label>
          <CustomButton
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              append({ inventoryId: "", quantity: 1, unitCost: 0 })
            }
          >
            <Plus className="h-3 w-3 mr-1" /> Add Item
          </CustomButton>
        </div>

        {form.formState.errors.items?.root && (
          <p className="text-xs text-destructive">
            {form.formState.errors.items.root.message}
          </p>
        )}

        {/* Table header */}
        <div className="grid grid-cols-[3fr_1fr_1fr_1fr_auto] gap-2 text-xs text-muted-foreground px-1">
          <span>Item</span>
          <span>Qty</span>
          <span>Unit Cost</span>
          <span>Total</span>
          <span></span>
        </div>

        {/* Line items */}
        <div className="max-h-75 overflow-y-auto space-y-2 pr-1">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="grid grid-cols-[3fr_1fr_1fr_1fr_auto] gap-2 items-start max-h- "
            >
              <CustomDropdown
                label=""
                placeholder="Select item"
                value={form.watch(`items.${index}.inventoryId`)}
                onChange={(val) => {
                  form.setValue(`items.${index}.inventoryId`, val, {
                    shouldValidate: true,
                  });
                  const inv = inventories.find((i) => i.id === val);
                  if (inv) {
                    form.setValue(`items.${index}.unitCost`, inv.unitPrice, {
                      shouldValidate: true,
                    });
                  }
                }}
                error={
                  form.formState.errors.items?.[index]?.inventoryId?.message
                }
                // Discontinued items can't be added, but stay visible on lines that already use them
                options={inventories
                  .filter(
                    (inv) =>
                      inv.status !== "discontinued" ||
                      inv.id === form.watch(`items.${index}.inventoryId`),
                  )
                  .map((inv) => ({
                    label: `${inv.name} (${inv.unit.toLowerCase()})`,
                    value: inv.id,
                  }))}
              />

              {/* Quantity */}
              <CustomInput
                label=""
                type="number"
                placeholder="Qty"
                className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                error={form.formState.errors.items?.[index]?.quantity?.message}
                {...form.register(`items.${index}.quantity`, {
                  valueAsNumber: true,
                })}
              />

              {/* Unit Cost */}
              <CustomInput
                label=""
                type="number"
                placeholder="Cost"
                prefix="₱"
                className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                error={form.formState.errors.items?.[index]?.unitCost?.message}
                {...form.register(`items.${index}.unitCost`, {
                  valueAsNumber: true,
                })}
              />

              {/* Line Total */}
              <div className="flex items-center  h-10 text-sm font-medium">
                {formatPeso(lineTotal(index))}
              </div>

              {/* Remove */}
              <CustomButton
                variant="ghost"
                size="icon"
                onClick={() => remove(index)}
                disabled={fields.length === 1}
                aria-label="Remove item"
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </CustomButton>
            </div>
          ))}
        </div>

        {/* Grand Total */}
        <div className="flex justify-end pt-2 border-t">
          <span className="text-sm font-semibold">
            Total: {formatPeso(grandTotal)}
          </span>
        </div>
      </div>

      <div className="flex justify-end">
        <CustomButton type="submit" loading={form.formState.isSubmitting}>
          {purchase ? "Update Purchase" : "Create Purchase"}
        </CustomButton>
      </div>
    </form>
  );
}
