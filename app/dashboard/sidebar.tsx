"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import {
  MdDashboard,
  MdInventory,
  MdCategory,
  MdManageAccounts,
} from "react-icons/md";
import { FaCartFlatbed, FaClipboardList } from "react-icons/fa6";
import { IoStatsChartSharp } from "react-icons/io5";
import { IconType } from "react-icons";
import LogoutButton from "@/components/LogoutButton";
import CustomButton from "@/components/CustomButton";
import { BrandMark } from "@/components/BrandMark";

type SidebarUser = {
  fullName: string | null;
  email: string;
  role: string;
  permissions: string[];
};

type NavSubItem = {
  label: string;
  href: string;
  permission?: string;
};

type NavItem = {
  label: string;
  href?: string;
  icon: IconType;
  exact?: boolean;
  permission?: string;
  subItems?: NavSubItem[];
};

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: MdDashboard,
    exact: true,
    permission: "dashboard:read",
  },
  {
    label: "Inventory",
    href: "/dashboard/inventory",
    icon: MdInventory,
    exact: true,
    permission: "inventory:read",
  },
  {
    label: "Category",
    href: "/dashboard/category",
    icon: MdCategory,
    exact: true,
    permission: "category:read",
  },
  {
    label: "Supplier",
    href: "/dashboard/supplier",
    icon: FaCartFlatbed,
    exact: true,
    permission: "supplier:read",
  },
  {
    label: "Purchase",
    href: "/dashboard/purchase",
    icon: FaClipboardList,
    exact: true,
    permission: "purchase:read",
  },
  {
    label: "Reports",
    href: "/dashboard/reports",
    icon: IoStatsChartSharp,
    exact: true,
    permission: "reports:read",
  },
  {
    label: "Access Management",
    icon: MdManageAccounts,
    subItems: [
      {
        label: "User Management",
        href: "/dashboard/accessManagement/users",
        permission: "access-management:read:users",
      },
      {
        label: "Role Management",
        href: "/dashboard/accessManagement/roles",
        permission: "access-management:read:roles",
      },
    ],
  },
];

export default function DashboardSidebar({
  user,
  isCollapsed,
  setIsCollapsed,
}: {
  user: SidebarUser | null;
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}) {
  const pathname = usePathname();
  const [isHovered, setIsHovered] = useState(false);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    "Access Management": false,
  });

  const toggleMenu = (label: string) => {
    setOpenMenus((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  const isParentActive = (item: NavItem) => {
    if (item.href) {
      return item.exact
        ? pathname === item.href
        : pathname.startsWith(item.href);
    }
    if (item.subItems) {
      return item.subItems.some((sub) => pathname.startsWith(sub.href));
    }
    return false;
  };

  const isExpanded = !isCollapsed || isHovered;

  // Hide links the user can't open. Pages also enforce this on the server
  const permissions = user?.permissions ?? [];
  const allowed = (permission?: string) =>
    !permission || permissions.includes(permission);
  const visibleNavItems = navItems
    .map((item) =>
      item.subItems
        ? {
            ...item,
            subItems: item.subItems.filter((sub) => allowed(sub.permission)),
          }
        : item,
    )
    .filter((item) =>
      item.subItems ? item.subItems.length > 0 : allowed(item.permission),
    );

  return (
    <aside
      onMouseEnter={() => isCollapsed && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={` flex h-screen flex-col bg-sidebar text-sidebar-foreground px-4 transition-[width] ease-in-out
 duration-300 ${isExpanded ? "w-64" : "w-20"}`}
    >
      {/* Header */}
      <div className="h-16 py-4 border-b border-sidebar-border mb-2 flex items-center pl-3">
        <div className="flex items-center gap-2 font-semibold text-lg">
          <BrandMark className="size-6 text-sidebar-primary" />
          <span
            className={`transition-opacity duration-300 whitespace-nowrap ${
              !isExpanded ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
            }`}
          >
            Bean Counter
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="space-y-2">
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = isParentActive(item);
          const hasSubItems = item.subItems && item.subItems.length > 0;
          const isOpen = openMenus[item.label];

          return (
            <div key={item.label}>
              {hasSubItems ? (
                <>
                  <CustomButton
                    variant={isActive ? "sidebar-active" : "sidebar"}
                    size="nav"
                    onClick={() => isExpanded && toggleMenu(item.label)}
                    aria-expanded={isExpanded && isOpen}
                    title={!isExpanded ? item.label : undefined}
                  >
                    <Icon className="size-5 shrink-0" />
                    <span
                      className={`transition-opacity duration-300 whitespace-nowrap flex-1 text-left ${
                        !isExpanded
                          ? "opacity-0 w-0 overflow-hidden"
                          : "opacity-100"
                      }`}
                    >
                      {item.label}
                    </span>
                    <ChevronRight
                      className={`size-4 shrink-0 transition-transform duration-300  ${
                        !isExpanded
                          ? "opacity-0 w-0 overflow-hidden"
                          : isOpen
                            ? "rotate-90"
                            : ""
                      }`}
                    />
                  </CustomButton>

                  {/* Submenu */}
                  <div
                    className={`ml-8 mt-1 space-y-1 transform-gpu origin-top transition-all duration-300 ease-in-out ${
                      isExpanded && isOpen
                        ? "scale-y-100 opacity-100"
                        : "scale-y-0 opacity-0 pointer-events-none"
                    }`}
                  >
                    {item.subItems!.map((subItem) => {
                      const isSubActive = pathname === subItem.href;

                      return (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          className={`block rounded px-3 py-1.5 text-sm ${
                            isSubActive
                              ? "font-medium text-sidebar-foreground"
                              : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                          }`}
                        >
                          <span className="whitespace-nowrap">
                            {subItem.label}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </>
              ) : (
                <CustomButton
                  asChild
                  variant={isActive ? "sidebar-active" : "sidebar"}
                  size="nav"
                >
                  <Link
                    href={item.href!}
                    title={!isExpanded ? item.label : undefined}
                  >
                    <Icon className="size-5 shrink-0" />
                    <span
                      className={`transition-opacity duration-300 whitespace-nowrap ${
                        !isExpanded
                          ? "opacity-0 w-0 overflow-hidden"
                          : "opacity-100"
                      }`}
                    >
                      {item.label}
                    </span>
                  </Link>
                </CustomButton>
              )}
            </div>
          );
        })}
      </nav>

      <div className="flex-1" />

      {/* User Profile */}
      {user && (
        <div className="border-t border-sidebar-border h-20  flex items-center gap-3 w-full  transition-opacity">
          <Link
            href="/dashboard/profile"
            className="flex items-center gap-3 w-full hover:opacity-80 transition-opacity"
          >
            <div className="size-9 flex items-center justify-center rounded-full bg-sidebar-accent shrink-0">
              {user.fullName?.[0] ?? "U"}
            </div>

            <div
              className={`transition-all duration-300 overflow-hidden ${
                !isExpanded ? "opacity-0 w-0" : "opacity-100 w-full"
              }`}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {user.fullName ?? "User"}
                </p>
                <p className="truncate text-xs text-sidebar-foreground/60">
                  {user.role}
                </p>
              </div>
            </div>
          </Link>
          <div
            className={`transition-all duration-300 overflow-hidden ${
              !isExpanded ? "opacity-0 w-0" : "opacity-100 w-16 ml-auto "
            }`}
          >
            <LogoutButton />
          </div>
        </div>
      )}
    </aside>
  );
}
