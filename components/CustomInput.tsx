"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { EyeOff } from "lucide-react";
import { Eye } from "lucide-react";
import { useState } from "react";
import { Textarea } from "./ui/textarea";

type CustomInputProps = {
  label: string;
  required?: boolean;
  error?: string;
  className?: string;
  prefix?: string;
  suffix?: string;
  multiline?: boolean;
} & React.ComponentProps<typeof Input>;

export function CustomInput({
  label,
  required,
  error,
  className,
  id,
  prefix,
  suffix,
  type,
  multiline = false,
  ...props
}: CustomInputProps) {
  const inputId = id ?? props.name;
  const isPassword = type === "password";
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <Label htmlFor={inputId}>
          {label}
          {required && <span className="text-destructive">*</span>}
        </Label>

        {error && <span className="text-xs text-destructive">{error}</span>}
      </div>

      {/* <Input
        id={inputId}
        aria-invalid={Boolean(error)}
        className={cn(
          error && "border-destructive focus:ring-destructive",
          className,
        )}
        {...props}
      /> */}

      <div className="relative">
        {multiline ? (
          <Textarea
            id={inputId}
            aria-invalid={Boolean(error)}
            className={cn(
              error && "border-destructive focus-visible:ring-destructive",
              "focus-visible:ring-0 focus-visible:ring-offset-0",
              className,
            )}
            {...(props as any)}
          />
        ) : (
          <>
            {prefix && (
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none z-10">
                {prefix}
              </span>
            )}
            <Input
              id={inputId}
              type={isPassword ? (showPassword ? "text" : "password") : type}
              aria-invalid={Boolean(error)}
              className={cn(
                prefix && "pl-7",
                isPassword && "pr-10",
                error && "border-destructive focus-visible:ring-destructive",
                "focus-visible:ring-0 focus-visible:ring-offset-0",
                className,
              )}
              {...props}
            />
            {isPassword && (
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground z-10"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            )}
            {suffix && !isPassword && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none z-10">
                {suffix}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
