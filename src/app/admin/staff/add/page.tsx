import { requireAdminOrSuperAdmin } from "@/lib/auth-library";
import { getStaffMembers } from "./actions";
import { StaffTable } from "@/components/admin/staff-table";
import { StaffRegistrationDialog } from "@/components/admin/staff-registration-dialog";

export default async function AdminStaffPage() {
  const session = await requireAdminOrSuperAdmin();
  const staff = await getStaffMembers();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Staff Management</h2>
          <p className="text-muted-foreground">
            Manage staff members and create new staff accounts
          </p>
        </div>
        <StaffRegistrationDialog />
      </div>

      <StaffTable staff={staff} />
    </div>
  );
}
