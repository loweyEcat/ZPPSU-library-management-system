import { requireSuperAdmin } from "@/lib/auth-library";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import {
  FileCheck,
  Users,
  UserPlus,
  Library,
  BookOpen,
  FileText,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function AdminPage() {
  const session = await requireSuperAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome back, {session.user.fullName}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              All registered users
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Staff Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Active staff</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Registered students</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Total resources</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              <Link href="/admin/thesis-verification">
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto py-3"
                >
                  <FileCheck className="mr-3 h-5 w-5" />
                  <div className="text-left">
                    <div className="font-semibold">
                      Documents Verification Panel
                    </div>
                    <div className="text-xs text-muted-foreground font-normal">
                      Review and verify student thesis documents
                    </div>
                  </div>
                </Button>
              </Link>
              <Link href="/admin/users">
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto py-3"
                >
                  <Users className="mr-3 h-5 w-5" />
                  <div className="text-left">
                    <div className="font-semibold">Users</div>
                    <div className="text-xs text-muted-foreground font-normal">
                      Manage all users in the system
                    </div>
                  </div>
                </Button>
              </Link>
              <Link href="/admin/staff/add">
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto py-3"
                >
                  <UserPlus className="mr-3 h-5 w-5" />
                  <div className="text-left">
                    <div className="font-semibold">Add Staff</div>
                    <div className="text-xs text-muted-foreground font-normal">
                      Create new staff member accounts
                    </div>
                  </div>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>System Information</CardTitle>
            <CardDescription>Library Management System</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Role:</span>
                <span className="font-medium">{session.user.userRole}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status:</span>
                <span className="font-medium">{session.user.status}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
