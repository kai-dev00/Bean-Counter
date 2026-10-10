"use client";

import { useState } from "react";
import DashboardSidebar from "./sidebar";
import DashboardHeader from "./header";
import { NavigationProgress } from "./utils/ProgressBar";
import { RealtimeProvider } from "@upstash/realtime/client";

export default function DashboardLayoutWrapper({
  children,
  sidebarUser,
}: {
  children: React.ReactNode;
  sidebarUser: any;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // The header's menu button collapses the sidebar on desktop and opens the
  // slide-over on small screens
  const toggleSidebar = (value: boolean) => {
    if (window.matchMedia("(min-width: 768px)").matches) {
      setIsCollapsed(value);
    } else {
      setMobileOpen((open) => !open);
    }
  };

  return (
    <RealtimeProvider api={{ url: "/api/realtime" }}>
      <div className="flex h-screen overflow-hidden">
        {/* Desktop sidebar */}
        <div className="hidden md:block shrink-0">
          <DashboardSidebar
            user={sidebarUser}
            isCollapsed={isCollapsed}
            setIsCollapsed={setIsCollapsed}
          />
        </div>

        {/* Mobile slide-over */}
        {mobileOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setMobileOpen(false)}
            />
            <div
              className="absolute inset-y-0 left-0 shadow-xl animate-in slide-in-from-left duration-200"
              // Close after picking a page
              onClick={(e) => {
                if ((e.target as HTMLElement).closest("a")) {
                  setMobileOpen(false);
                }
              }}
            >
              <DashboardSidebar
                user={sidebarUser}
                isCollapsed={false}
                setIsCollapsed={() => setMobileOpen(false)}
              />
            </div>
          </div>
        )}

        <div className="flex flex-1 flex-col overflow-hidden">
          <DashboardHeader
            user={sidebarUser}
            isCollapsed={isCollapsed}
            setIsCollapsed={toggleSidebar}
          />
          <div className="h-1 w-full">
            <NavigationProgress />
          </div>

          <main className="flex-1 overflow-y-auto p-4">{children}</main>
        </div>
      </div>
    </RealtimeProvider>
  );
}
