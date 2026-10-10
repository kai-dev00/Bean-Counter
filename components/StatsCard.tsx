// "use client";

// import { Card, CardContent } from "@/components/ui/card";
// import { LucideIcon } from "lucide-react";
// import { cn } from "@/lib/utils";

// type StatsCardProps = {
//   title: string;
//   value: string | number;
//   icon: LucideIcon;
//   description?: string;
//   trend?: {
//     value: number;
//     label?: string;
//   };
//   className?: string;
//   onClick?: () => void;
//   active?: boolean;
// };

// export function StatsCard({
//   title,
//   value,
//   icon: Icon,
//   description,
//   trend,
//   className,
//   onClick,
//   active = false,
// }: StatsCardProps) {
//   const isPositive = trend && trend.value >= 0;

//   return (
//     <Card
//       className={cn(
//         "transition-all",
//         onClick && "cursor-pointer hover:border-primary",
//         active && "border-primary bg-primary/5",
//         className,
//       )}
//       onClick={onClick}
//     >
//       <CardContent className=" px-6">
//         <div className="flex items-center justify-between">
//           <p className="text-sm font-medium text-muted-foreground">{title}</p>
//           <div className="p-2 bg-muted rounded-md">
//             <Icon className="h-4 w-4 text-muted-foreground" />
//           </div>
//         </div>

//         <div className="mt-3">
//           <p className="text-2xl font-bold">{value}</p>

//           {trend && (
//             <p
//               className={cn(
//                 "text-xs mt-1",
//                 isPositive ? "text-green-600 dark:text-green-400" : "text-destructive",
//               )}
//             >
//               {isPositive ? "▲" : "▼"} {Math.abs(trend.value)}%{" "}
//               <span className="text-muted-foreground">
//                 {trend.label ?? "from last month"}
//               </span>
//             </p>
//           )}

//           {description && (
//             <p className="text-xs text-muted-foreground mt-1">{description}</p>
//           )}
//         </div>
//       </CardContent>
//     </Card>
//   );
// }

"use client";

import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type StatsCardProps = {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    label?: string;
  };
  className?: string;
  onClick?: () => void;
  active?: boolean;
  color?: "default" | "warning" | "danger" | "success";
};

const colorConfig = {
  default: {
    icon: "bg-primary/10 text-primary",
    active: "border-primary bg-primary/5",
    hover: "hover:border-primary/40",
  },
  warning: {
    icon: "bg-yellow-50 text-yellow-600 dark:bg-yellow-500/15 dark:text-yellow-400",
    active: "border-yellow-500 bg-yellow-50/50 dark:bg-yellow-500/10",
    hover: "hover:border-yellow-300",
  },
  danger: {
    icon: "bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400",
    active: "border-red-500 bg-red-50/50 dark:bg-red-500/10",
    hover: "hover:border-red-300",
  },
  success: {
    icon: "bg-green-50 text-green-600 dark:bg-green-500/15 dark:text-green-400",
    active: "border-green-500 bg-green-50/50 dark:bg-green-500/10",
    hover: "hover:border-green-300",
  },
};

export function StatsCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  className,
  onClick,
  active = false,
  color = "default",
}: StatsCardProps) {
  const isPositive = trend && trend.value >= 0;
  const colors = colorConfig[color];

  return (
    <Card
      className={cn(
        "transition-all duration-200 border",
        onClick && `cursor-pointer ${colors.hover}`,
        active ? colors.active : "hover:shadow-sm",
        className,
      )}
      onClick={onClick}
    >
      <CardContent className="px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-3 flex-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {title}
            </p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            {trend && (
              <p
                className={cn(
                  "text-xs flex items-center gap-1",
                  isPositive ? "text-green-600 dark:text-green-400" : "text-destructive",
                )}
              >
                <span>
                  {isPositive ? "▲" : "▼"} {Math.abs(trend.value)}%
                </span>
                <span className="text-muted-foreground">
                  {trend.label ?? "from last month"}
                </span>
              </p>
            )}
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          <div className={cn("p-2.5 rounded-lg shrink-0", colors.icon)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
