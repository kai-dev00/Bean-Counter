"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import CustomButton from "./CustomButton";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <CustomButton
      variant="ghost"
      size="icon-sm"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label="Toggle theme"
    >
      {/* Icons swap via the .dark class, so no hydration mismatch */}
      <Sun className="size-5 hidden dark:block" />
      <Moon className="size-5 dark:hidden" />
    </CustomButton>
  );
}
