import { requireAdminOrSuperAdmin } from "@/lib/auth-library";
import { getAdminStaffMembers, getStudents } from "./actions";
import { AdminStaffTable } from "@/components/admin/admin-staff-table";
import { StudentsTable } from "@/components/admin/students-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Users, GraduationCap, UserCheck, UserX } from "lucide-react";

export default async function AdminUsersPage() {
  const session = await requireAdminOrSuperAdmin();
  const [staff, students] = await Promise.all([
    getAdminStaffMembers(),
    getStudents(),
  ]);

  const activeStaff = staff.filter((s) => s.status === "Active").length;
  const inactiveStaff = staff.length - activeStaff;
  const activeStudents = students.filter((s) => s.status === "Active").length;
  const inactiveStudents = students.length - activeStudents;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Users Management</h2>
            <p className="text-muted-foreground">
              Manage admin staff and student accounts
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-2 transition-all hover:shadow-md">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
              <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">Total Staff</p>
              <p className="text-2xl font-bold">{staff.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 transition-all hover:shadow-md">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10">
              <UserCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">Active Staff</p>
              <p className="text-2xl font-bold">{activeStaff}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 transition-all hover:shadow-md">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/10">
              <GraduationCap className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">Total Students</p>
              <p className="text-2xl font-bold">{students.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 transition-all hover:shadow-md">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/10">
              <UserCheck className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">Active Students</p>
              <p className="text-2xl font-bold">{activeStudents}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Section */}
      <Card className="border-2 shadow-sm">
        <CardContent className="p-6">
          <Tabs defaultValue="staff" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
              <TabsTrigger value="staff" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Admin Staff ({staff.length})
              </TabsTrigger>
              <TabsTrigger value="students" className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Students ({students.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="staff" className="space-y-4 mt-0">
              <AdminStaffTable staff={staff} isSuperAdmin={session.user.userRole === "Super_Admin"} />
            </TabsContent>

            <TabsContent value="students" className="space-y-4 mt-0">
              <StudentsTable students={students} isSuperAdmin={session.user.userRole === "Super_Admin"} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

