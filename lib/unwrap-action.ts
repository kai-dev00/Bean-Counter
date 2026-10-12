import type { ActionResult } from "@/lib/action-result";

// Client helper: turns a failed ActionResult back into a thrown Error, so
// existing try/catch handlers can show `err.message`
export async function unwrap(result: Promise<ActionResult>) {
  const res = await result;
  if (!res.success) throw new Error(res.error);
}
