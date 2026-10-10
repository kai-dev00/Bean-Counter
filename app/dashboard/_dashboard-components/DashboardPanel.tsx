import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
};

// Shared card shell so every dashboard widget has the same surface and header
export function DashboardPanel({
  title,
  icon: Icon,
  action,
  className,
  children,
}: Props) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card text-card-foreground p-5 shadow-sm flex flex-col gap-4",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        {Icon && (
          <span className="p-1.5 rounded-md bg-primary/10 text-primary">
            <Icon className="size-4" />
          </span>
        )}
        <h3 className="font-semibold text-sm">{title}</h3>
        {action && <div className="ml-auto">{action}</div>}
      </div>
      {children}
    </div>
  );
}
