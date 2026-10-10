"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import CustomDropdown, { DropdownItem } from "@/components/CustomDropdown";

type Option = { label: string; value: string };

type QuantityInputProps = {
  label?: string;
  required?: boolean;
  error?: string;
  unitValue: string;
  onUnitChange: (val: string) => void;
  unitOptions: Option[];
} & React.ComponentProps<typeof Input>;

export function QuantityInput({
  label,
  required,
  error,
  unitValue,
  onUnitChange,
  unitOptions,
  className,
  ...props
}: QuantityInputProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <Label>
          {label}
          {required && <span className="text-destructive">*</span>}
        </Label>
        {error && <span className="text-xs text-destructive">{error}</span>}
      </div>

      <div className="flex">
        <Input
          className={cn(
            "rounded-r-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
            "focus-visible:ring-0 focus-visible:ring-offset-0",
            error && "border-destructive focus-visible:border-destructive",
            className,
          )}
          {...props}
        />
        <div className="w-24 shrink-0">
          <CustomDropdown
            portal
            trigger={
              <button
                type="button"
                className={cn(
                  "border-input dark:bg-input/30 flex h-9 w-full items-center justify-between gap-1 rounded-r-md border border-l-0 bg-transparent px-3 text-sm shadow-xs cursor-pointer outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                  error && "border-destructive",
                )}
              >
                {unitOptions.find((opt) => opt.value === unitValue)?.label ??
                  unitValue}
                <ChevronDown className="size-4 text-muted-foreground" />
              </button>
            }
          >
            {unitOptions.map((opt) => (
              <DropdownItem
                key={opt.value}
                onClick={() => onUnitChange(opt.value)}
                className={
                  opt.value === unitValue ? "font-medium text-primary" : ""
                }
              >
                {opt.label}
              </DropdownItem>
            ))}
          </CustomDropdown>
        </div>
      </div>
    </div>
  );
}
