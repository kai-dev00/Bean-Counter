import { getAllPermissions } from "../../actions/roles";
import { RoleForm } from "../../components/RolesManagementForm";
import { requirePermission } from "@/lib/auth-guard";

export default async function AddRolePage() {
  await requirePermission("access-management:create:roles");

  const permissions = await getAllPermissions();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold ">Create New Role</h1>
        <p className="text-muted-foreground">
          Define a new role with permissions
        </p>
      </div>

      <RoleForm permissions={permissions} />
    </div>
  );
}

export const metadata = { title: "Add Role" };
