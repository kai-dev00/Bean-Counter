"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import CustomButton from "@/components/CustomButton";

// Catches errors thrown while rendering any dashboard page
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <div className="max-w-md w-full rounded-xl border bg-card p-8 text-center space-y-4 shadow-sm">
        <div className="mx-auto w-fit rounded-full bg-destructive/10 p-3 text-destructive">
          <AlertTriangle className="size-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Something went wrong</h2>
          <p className="text-sm text-muted-foreground">
            This page couldn&apos;t be loaded. Try again, and if it keeps
            happening, contact your administrator.
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground">
              Error ID: {error.digest}
            </p>
          )}
        </div>
        <CustomButton onClick={reset}>Try again</CustomButton>
      </div>
    </div>
  );
}
