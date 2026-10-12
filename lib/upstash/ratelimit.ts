import { Ratelimit } from "@upstash/ratelimit";
import { headers } from "next/headers";
import { redis } from "./redis";

// Per IP: stops one client hammering many accounts
const loginByIp = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "1 m"),
  prefix: "ratelimit:login:ip",
});

// Per email: stops brute-forcing one account from many IPs.
// Reset after a successful login
const loginByEmail = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "15 m"),
  prefix: "ratelimit:login:email",
});

const forgotPasswordByIp = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 h"),
  prefix: "ratelimit:forgot:ip",
});

// Stops flooding one inbox with reset emails
const forgotPasswordByEmail = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "1 h"),
  prefix: "ratelimit:forgot:email",
});

async function getClientIp() {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0].trim() ||
    h.get("x-real-ip") ||
    "unknown"
  );
}

// Returns false when the caller is over the limit. Fails open if Redis is
// unreachable, so an Upstash outage doesn't lock everyone out
async function checkLimits(checks: [Ratelimit, string][]) {
  try {
    const results = await Promise.all(
      checks.map(([limiter, key]) => limiter.limit(key)),
    );
    return results.every((r) => r.success);
  } catch (error) {
    console.error("Rate limit check failed:", error);
    return true;
  }
}

export async function checkLoginLimit(email: string) {
  return checkLimits([
    [loginByIp, await getClientIp()],
    [loginByEmail, email.toLowerCase()],
  ]);
}

export async function resetLoginLimit(email: string) {
  try {
    await loginByEmail.resetUsedTokens(email.toLowerCase());
  } catch (error) {
    console.error("Rate limit reset failed:", error);
  }
}

export async function checkForgotPasswordLimit(email: string) {
  return checkLimits([
    [forgotPasswordByIp, await getClientIp()],
    [forgotPasswordByEmail, email.toLowerCase()],
  ]);
}
