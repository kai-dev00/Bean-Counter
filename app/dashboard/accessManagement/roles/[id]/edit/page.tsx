import { notFound } from "next/navigation";
import { RoleForm } from "../../../components/RolesManagementForm";
import { getAllPermissions, getRoleById } from "../../../actions/roles";
import { requirePermission } from "@/lib/auth-guard";

type Props = {
  params: { id: string };
};

export default async function EditRolePage({ params }: Props) {
  await requirePermission("access-management:update:roles");

  const { id } = await params;
  const [role, permissions] = await Promise.all([
    getRoleById(id),
    getAllPermissions(),
  ]);

  if (!role) {
    notFound();
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Edit Role</h1>
        <p className="text-muted-foreground">
          Update role details and permissions
        </p>
      </div>

      <RoleForm role={role} permissions={permissions} />
    </div>
  );
}

export const metadata = { title: "Edit Role" };
