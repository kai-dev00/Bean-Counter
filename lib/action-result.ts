import { unstable_rethrow } from "next/navigation";
import { ZodError } from "zod";

// Server actions return this instead of throwing, because Next.js replaces
// thrown messages with a generic one in production builds
export type ActionResult = { success: true } | { success: false; error: string };

// Throw this for messages that are safe to show the user.
// Any other error is logged and shown as a generic message
export class ActionError extends Error {}

type PrismaErrorMessages = Partial<Record<"P2002" | "P2003" | "P2025", string>>;

const defaultPrismaMessages: Required<PrismaErrorMessages> = {
  P2002: "A record with the same value already exists.",
  P2003: "This record is still used by other records, so it can't be deleted.",
  P2025: "This record no longer exists or was changed by someone else.",
};

function getPrismaCode(error: unknown) {
  const code = (error as { code?: unknown } | null)?.code;
  return typeof code === "string" && code in defaultPrismaMessages
    ? (code as keyof typeof defaultPrismaMessages)
    : null;
}

/**
 * Runs an action body and turns failures into `{ success: false, error }`.
 * Pass `messages` to replace the default text for a Prisma error code with
 * something specific to the action (e.g. what blocks a delete).
 */
export async function runAction(
  fn: () => Promise<void>,
  messages: PrismaErrorMessages = {},
): Promise<ActionResult> {
  try {
    await fn();
    return { success: true };
  } catch (error) {
    // Let Next.js handle redirect() / notFound() (e.g. from requirePermission)
    unstable_rethrow(error);

    if (error instanceof ActionError) {
      return { success: false, error: error.message };
    }
    if (error instanceof ZodError) {
      return { success: false, error: error.issues[0]?.message ?? "Invalid input" };
    }

    const code = getPrismaCode(error);
    if (code) {
      return { success: false, error: messages[code] ?? defaultPrismaMessages[code] };
    }

    console.error("Action failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
