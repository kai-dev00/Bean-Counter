import { z } from "zod";

// Shared by the form (client) and the actions (server)
export const categorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(50),
  description: z.string().optional(),
  icon: z.string().max(5).optional(),
  color: z.string().optional(),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;
