import z from "zod";
import { InventoryUnit } from "@/app/generated/prisma/browser";

// Shared by the form (client) and the actions (server)
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
