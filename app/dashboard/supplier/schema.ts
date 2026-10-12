import z from "zod";

// Shared by the form (client) and the actions (server)
export const supplierSchema = z.object({
  name: z.string().min(1, "Required").max(100),
  email: z.string().min(1, "Required").email("Invalid email address"),
  phone: z
    .string()
    .min(1, "Required")
    .regex(/^\+?[\d\s\-\(\)]{7,20}$/, "Invalid phone number"),
  address: z.string().min(1, "Required").max(255),
  notes: z.string().optional(),
});

export type SupplierFormValues = z.infer<typeof supplierSchema>;
