"use client";

import { Category } from "@/app/generated/prisma/browser";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import CustomButton from "@/components/CustomButton";
import { useRouter } from "next/navigation";
import { showToast } from "@/lib/toast";
import { createCategory, updateCategory } from "../actions";
import { CustomInput } from "@/components/CustomInput";
import { CategoryFormValues, categorySchema } from "../CategoryClient";

type CategoryFormProps = {
  category: Category | null;
  onSuccess: () => void;
};

export default function CategoryForm({
  category,
  onSuccess,
}: CategoryFormProps) {
  const router = useRouter();

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name ?? "",
      description: category?.description ?? "",
      icon: category?.icon ?? "",
      color: category?.color ?? "",
    },
  });

  const { handleSubmit, formState } = form;

  const onSubmit = async (values: CategoryFormValues) => {
    try {
      if (category) {
        await updateCategory(category.id, values);
        showToast.success("Category successfully updated");
      } else {
        await createCategory(values);
        showToast.success("Category successfully created");
      }

      router.refresh();
      onSuccess();
    } catch {
      showToast.error("Something went wrong");
    }
  };

  const isEditMode = Boolean(category);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <CustomInput
        label="Name"
        required={!isEditMode}
        placeholder="Name"
        error={form.formState.errors.name?.message}
        {...form.register("name")}
      />

      <CustomInput
        label="Description"
        required={!isEditMode}
        placeholder="Description"
        error={form.formState.errors.description?.message}
        {...form.register("description")}
      />

      <div className="grid grid-cols-2 gap-2 ">
        <CustomInput
          label="Icon"
          required={!isEditMode}
          placeholder="Icon"
          error={form.formState.errors.icon?.message}
          {...form.register("icon")}
        />
        <CustomInput
          label="Color"
          required={!isEditMode}
          placeholder="Color"
          error={form.formState.errors.color?.message}
          {...form.register("color")}
        />
      </div>

      <div className="flex w-full justify-end">
        <CustomButton type="submit" loading={formState.isSubmitting}>
          {category ? "Update Category" : "Create Category"}
        </CustomButton>
      </div>
    </form>
  );
}
