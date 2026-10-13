"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { RiMenuFold3Fill, RiMenuFill } from "react-icons/ri";
import { ThemeToggle } from "@/components/ThemeToggle";
import CustomButton from "@/components/CustomButton";

type SidebarUser = {
  fullName: string | null;
  email: string;
  role: string;
};

const routeTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/inventory": "Inventory",
  "/dashboard/category": "Category",
  "/dashboard/supplier": "Supplier",
  "/dashboard/purchase": "Purchase",
  "/dashboard/reports": "Reports",
  "/dashboard/accessManagement": "Access Management",
  "/dashboard/accessManagement/users": "Access Management",
  "/dashboard/accessManagement/roles": "Access Management",
  "/dashboard/accessManagement/logs": "Access Management",
  "/dashboard/profile": "Profile",
};

export default function DashboardHeader({
  user,
  isCollapsed,
  setIsCollapsed,
}: {
  user: SidebarUser | null;
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}) {
  const pathname = usePathname();
  const title = routeTitles[pathname] || "Dashboard";

  return (
    <header className="h-16 border-b bg-card px-4 sm:px-6 gap-2 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-4">
        <CustomButton
          variant="ghost"
          size="icon-sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <RiMenuFold3Fill className="size-5" />
          ) : (
            <RiMenuFill className="size-5" />
          )}
        </CustomButton>
        <h1 className="text-lg font-semibold">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        <ThemeToggle />
        <Link href="/dashboard/profile">
          {user && (
            <div className="min-w-0 hidden sm:block">
              <p className="truncate text-sm font-medium">
                {user.fullName ?? "User"}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {user.role}
              </p>
            </div>
          )}
        </Link>
      </div>
    </header>
  );
}
