import { refreshAction } from "@/app/actions/auth.refresh";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  console.log("🔄 Refresh API called");

  const { searchParams } = new URL(request.url);
  const requested = searchParams.get("returnTo");

  // Only allow same-origin relative paths ("/x"), not "//evil.com" or "/\evil.com"
  const returnTo =
    requested && /^\/(?![/\\])/.test(requested) ? requested : "/dashboard";

  try {
    await refreshAction();
    console.log("✅ Refresh successful, redirecting to:", returnTo);
    return NextResponse.redirect(new URL(returnTo, request.url));
  } catch (error) {
    console.log("❌ Refresh failed:", error);
    return NextResponse.redirect(new URL("/login", request.url));
  }
}
