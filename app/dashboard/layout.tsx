import { getCurrentUserWithDetails } from "@/lib/auth";
import { getPermissionStrings } from "@/lib/auth-guard";
import { AuthProvider } from "../(auth)/AuthProvider";
import DashboardLayoutWrapper from "./layout-wrapper";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, permissions] = await Promise.all([
    getCurrentUserWithDetails(),
    getPermissionStrings(),
  ]);
  const sidebarUser = user
    ? {
        fullName: user.fullName ?? null,
        email: user.email ?? "",
        role: user.role?.name ?? "USER",
        permissions: permissions ?? [],
      }
    : null;

  return (
    <AuthProvider
      value={{
        role: user?.role?.name ?? "GUEST",
      }}
    >
      <DashboardLayoutWrapper sidebarUser={sidebarUser}>
        {children}
      </DashboardLayoutWrapper>
    </AuthProvider>
  );
}
