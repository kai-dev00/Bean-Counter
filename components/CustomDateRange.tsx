import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { Calendar } from "./ui/calendar";
import CustomButton from "./CustomButton";
import { cn } from "@/lib/utils";

export function DateRangeFilter({
  value,
  onChange,
}: {
  value: { from: Date | null; to: Date | null };
  onChange: (range: { from: Date | null; to: Date | null }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [localRange, setLocalRange] = useState<{
    from: Date | null;
    to: Date | null;
  }>(value);

  // sync local with external on open
  const handleOpenChange = (v: boolean) => {
    if (v) setLocalRange(value);
    setOpen(v);
  };

  const handleConfirm = () => {
    onChange(localRange);
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLocalRange({ from: null, to: null });
    onChange({ from: null, to: null });
    setOpen(false);
  };
  const handleClearInside = () => {
    setLocalRange({ from: null, to: null });
    onChange({ from: null, to: null });
    setOpen(false);
  };

  const hasValue = value.from !== null;

  const label = value.from
    ? value.to && value.to !== value.from
      ? `${format(value.from, "MMM d")} – ${format(value.to, "MMM d, yyyy")}`
      : format(value.from, "MMM d, yyyy")
    : "";

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <CustomButton
          variant="outline"
          size="sm"
          className={cn(
            "font-normal",
            hasValue && "border-primary text-primary",
          )}
        >
          <CalendarIcon className="size-3.5" />
          {label}
          {hasValue && (
            <span
              onClick={handleClear}
              className="hover:opacity-70 cursor-pointer"
            >
              <X className="size-3.5" />
            </span>
          )}
        </CustomButton>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={{
            from: localRange.from ?? undefined,
            to: localRange.to ?? undefined,
          }}
          onSelect={(range: DateRange | undefined) => {
            setLocalRange({
              from: range?.from ?? null,
              to: range?.to ?? null,
            });
            // don't auto-close, wait for confirm
          }}
        />
        <div className="flex items-center justify-between px-3 py-2 border-t gap-2">
          <span className="text-xs text-muted-foreground">
            {localRange.from && localRange.to
              ? `${format(localRange.from, "MMM d")} – ${format(localRange.to, "MMM d, yyyy")}`
              : localRange.from
                ? `From ${format(localRange.from, "MMM d, yyyy")}`
                : "Select a date range"}
          </span>
          <div className="flex gap-2">
            <CustomButton
              variant="ghost"
              size="xs"
              onClick={handleClearInside}
              className="text-muted-foreground"
            >
              Clear
            </CustomButton>
            <CustomButton
              size="xs"
              onClick={handleConfirm}
              disabled={!localRange.from}
            >
              Apply
            </CustomButton>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
