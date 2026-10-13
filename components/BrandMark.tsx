import { cn } from "@/lib/utils";

const BEAN = "M180 37.93A104 70 -60 1 0 76 218.07A104 70 -60 1 0 180 37.93Z";
// Full crease for 24px and up; the small cut has two thicker steps so the gap stays open at favicon sizes.
const CREASE_FULL =
  "M81.5 206V165.5H107.5V120.5H133.5V75.5H159.5V50H174.5V90.5H148.5V135.5H122.5V180.5H96.5V206Z";
const CREASE_SMALL = "M84 200V152H116V80H148V56H172V104H140V176H108V200Z";

type BrandMarkProps = {
  className?: string;
  /** Use the simplified crease when rendering below ~24px. */
  small?: boolean;
  /** Accessible name; omit when the mark sits next to the "Bean Counter" text. */
  title?: string;
};

/** The Stepped Bean mark. Inherits its colour from `currentColor`. */
export function BrandMark({ className, small, title }: BrandMarkProps) {
  return (
    <svg
      viewBox="0 0 256 256"
      className={cn("size-6 shrink-0", className)}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <path
        fill="currentColor"
        fillRule="evenodd"
        d={BEAN + (small ? CREASE_SMALL : CREASE_FULL)}
      />
    </svg>
  );
}

/** Mark + name, used at the top of the auth cards. */
export function BrandLockup({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 text-lg font-semibold tracking-tight text-primary",
        className,
      )}
    >
      <BrandMark className="size-7" />
      <span>Bean Counter</span>
    </div>
  );
}
