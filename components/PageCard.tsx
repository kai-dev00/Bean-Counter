import { cn } from "@/lib/utils";

type Props = {
  title?: string;
  description?: string;
  /** Buttons etc. shown on the right of the title row */
  actions?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
};

// Standard page surface, so every page has the same padding, border and title row
export function PageCard({
  title,
  description,
  actions,
  className,
  children,
}: Props) {
  return (
    <section
      className={cn(
        "rounded-lg border bg-card text-card-foreground p-4 sm:p-6 space-y-4",
        className,
      )}
    >
      {(title || actions) && (
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="space-y-1">
            {title && <h2 className="text-lg font-semibold">{title}</h2>}
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}
