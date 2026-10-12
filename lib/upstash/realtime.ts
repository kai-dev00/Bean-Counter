import { InferRealtimeEvents, Realtime } from "@upstash/realtime";
import { z } from "zod";
import { redis } from "./redis";

const schema = {
  activity: {
    created: z.object({
      action: z.string(),
      module: z.string(),
      submodule: z.string().nullable(),
      recordId: z.string().nullable(),
      user: z.string().nullable(),
      createdAt: z.string(),
    }),
  },
};

export const realtime = new Realtime({ schema, redis });
export type RealtimeEvents = InferRealtimeEvents<typeof realtime>;

type ActivityEvent = z.infer<typeof schema.activity.created>;

// Best-effort: the write has already been saved, so a Redis hiccup must not
// make the action report failure
export async function emitActivity(event: ActivityEvent) {
  try {
    await realtime.emit("activity.created", event);
  } catch (error) {
    console.error("Realtime emit failed:", error);
  }
}
