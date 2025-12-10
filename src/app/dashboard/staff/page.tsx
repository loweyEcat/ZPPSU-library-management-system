import { requireStaffOrAbove } from "@/lib/auth-library";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { FileCheck, MessageSquare, BookOpen, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function StaffDashboardPage() {
  const session = await requireStaffOrAbove();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Staff Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome back, {session.user.fullName}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Assigned tasks</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Role</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {session.user.userRole === "Staff"
                ? "Staff"
                : session.user.userRole}
            </div>
            <p className="text-xs text-muted-foreground">Your position</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{session.user.status}</div>
            <p className="text-xs text-muted-foreground">Account status</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Active</div>
            <p className="text-xs text-muted-foreground">Profile complete</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common staff tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              <Link href="/dashboard/staff/thesis-verification">
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
              <Link href="/dashboard/staff/inquiries">
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto py-3"
                >
                  <MessageSquare className="mr-3 h-5 w-5" />
                  <div className="text-left">
                    <div className="font-semibold">Students Inquiries</div>
                    <div className="text-xs text-muted-foreground font-normal">
                      Manage student inquiries and messages
                    </div>
                  </div>
                </Button>
              </Link>
              <Link href="/dashboard/staff/books-requested">
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto py-3"
                >
                  <BookOpen className="mr-3 h-5 w-5" />
                  <div className="text-left">
                    <div className="font-semibold">Books Requested</div>
                    <div className="text-xs text-muted-foreground font-normal">
                      Review and process book requests
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
            <CardDescription>Your Account Details</CardDescription>
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
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium">{session.user.email}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
