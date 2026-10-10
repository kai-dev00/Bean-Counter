import { redirect } from "next/navigation";
import { getCurrentUserWithDetails } from "@/lib/auth";
import ProfileClient from "./components/ProfileClient";

export default async function ProfilePage() {
  const user = await getCurrentUserWithDetails();

  if (!user || !user.id) {
    redirect("/login");
  }

  return (
    <ProfileClient
      user={{
        id: user.id,
        fullName: user.fullName ?? null,
        email: user.email ?? null,
        role: user.role?.name ?? null,
        phoneNumber: user.phoneNumber ?? null,
        createdAt: user.createdAt?.toISOString() ?? null,
        updatedAt: user.updatedAt?.toISOString() ?? null,
      }}
    />
  );
}

export const metadata = { title: "Profile" };
