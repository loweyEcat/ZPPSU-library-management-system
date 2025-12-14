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
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Globe,
  Book,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getAdminDashboardStats,
  getDocumentTypeDistribution,
  getStatusDistribution,
  getMonthlySubmissions,
  getCollegeDistribution,
  getReadingActivity,
} from "./actions";
import { AdminDashboardCharts } from "@/components/admin/admin-dashboard-charts";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
  if (bytes < 1024 * 1024 * 1024)
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
}

export default async function AdminPage() {
  const session = await requireSuperAdmin();

  // Fetch all analytics data
  const [
    stats,
    documentTypeDistribution,
    statusDistribution,
    monthlySubmissions,
    collegeDistribution,
    readingActivity,
  ] = await Promise.all([
    getAdminDashboardStats(),
    getDocumentTypeDistribution(),
    getStatusDistribution(),
    getMonthlySubmissions(),
    getCollegeDistribution(),
    getReadingActivity(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome back, {session.user.fullName}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              All registered users
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Students</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.totalStudents}
            </div>
            <p className="text-xs text-muted-foreground">Registered students</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Staff Members</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {stats.totalStaff}
            </div>
            <p className="text-xs text-muted-foreground">Active staff</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Documents
            </CardTitle>
            <FileText className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.totalDocuments}
            </div>
            <p className="text-xs text-muted-foreground">All documents</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <Globe className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">
              {stats.publishedDocuments}
            </div>
            <p className="text-xs text-muted-foreground">Published resources</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Review
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.pendingDocuments}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
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
            <CardTitle className="text-sm font-medium">Total Storage</CardTitle>
            <Library className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatFileSize(stats.totalFileSize)}
            </div>
            <p className="text-xs text-muted-foreground">Total file size</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Reading Sessions
            </CardTitle>
            <BookOpen className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.totalReadingSessions.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Total sessions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reading Hours</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {Math.round(stats.totalReadingMinutes / 60).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Total hours read</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Users className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.totalAdmins}
            </div>
            <p className="text-xs text-muted-foreground">Admin accounts</p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Charts Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          <h3 className="text-2xl font-bold tracking-tight">
            Analytics & Insights
          </h3>
        </div>
        <AdminDashboardCharts
          documentTypeDistribution={documentTypeDistribution}
          statusDistribution={statusDistribution}
          monthlySubmissions={monthlySubmissions}
          collegeDistribution={collegeDistribution}
          readingActivity={readingActivity}
        />
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
            <CardDescription>Digital Library Management System</CardDescription>
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
