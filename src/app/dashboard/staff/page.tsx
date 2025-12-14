import { requireStaffOrAbove } from "@/lib/auth-library";
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
  MessageSquare,
  BookOpen,
  Settings,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  FileText,
  BarChart3,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getStaffDashboardStats,
  getDocumentTypeDistribution,
  getStatusDistribution,
  getMonthlyReviewActivity,
  getDocumentTypeByStatus,
} from "./actions";
import { StaffDashboardCharts } from "@/components/staff/staff-dashboard-charts";

export default async function StaffDashboardPage() {
  const session = await requireStaffOrAbove();

  // Fetch all analytics data
  const [
    stats,
    documentTypeDistribution,
    statusDistribution,
    monthlyReviewActivity,
    documentTypeByStatus,
  ] = await Promise.all([
    getStaffDashboardStats(),
    getDocumentTypeDistribution(),
    getStatusDistribution(),
    getMonthlyReviewActivity(),
    getDocumentTypeByStatus(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Staff Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome back, {session.user.fullName}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Assigned Documents
            </CardTitle>
            <FileText className="h-4 w-4 text-[#800020]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#800020]">
              {stats.assignedDocuments}
            </div>
            <p className="text-xs text-muted-foreground">
              Total assigned documents
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Reviews
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.pendingReviews}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reviewed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.reviewedDocuments}
            </div>
            <p className="text-xs text-muted-foreground">Documents reviewed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.approvedDocuments}
            </div>
            <p className="text-xs text-muted-foreground">Approved documents</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.rejectedDocuments}
            </div>
            <p className="text-xs text-muted-foreground">Rejected documents</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Revision Required
            </CardTitle>
            <RefreshCw className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.revisionRequired}
            </div>
            <p className="text-xs text-muted-foreground">Needs revision</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Book Requests</CardTitle>
            <BookOpen className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {stats.bookRequests}
            </div>
            <p className="text-xs text-muted-foreground">Total requests</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Requests
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {stats.pendingBookRequests}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting action</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Review Time
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">
              {stats.averageReviewTime}
            </div>
            <p className="text-xs text-muted-foreground">Days per review</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Role</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
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
      </div>

      {/* Analytics Charts Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-[#800020]" />
          <h3 className="text-2xl font-bold tracking-tight">
            Analytics & Insights
          </h3>
        </div>
        <StaffDashboardCharts
          documentTypeDistribution={documentTypeDistribution}
          statusDistribution={statusDistribution}
          monthlyReviewActivity={monthlyReviewActivity}
          documentTypeByStatus={documentTypeByStatus}
        />
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
