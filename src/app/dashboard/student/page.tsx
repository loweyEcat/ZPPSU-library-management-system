import { requireStudent } from "@/lib/auth-library";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getUnreadNotificationCount } from "./notifications/actions";
import {
  getStudentDashboardStats,
  getStatusDistribution,
  getMonthlySubmissions,
} from "./actions";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Bell,
  FileText,
  BookOpen,
  TrendingUp,
  CheckCircle2,
  Clock,
  XCircle,
  Globe,
  RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StudentDashboardCharts } from "@/components/student/student-dashboard-charts";

export default async function StudentDashboardPage() {
  const session = await requireStudent();
  const unreadCount = await getUnreadNotificationCount();
  const stats = await getStudentDashboardStats();
  const statusDistribution = await getStatusDistribution();
  const monthlySubmissions = await getMonthlySubmissions();

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Student Dashboard
          </h2>
          <p className="text-muted-foreground">
            Welcome back, {session.user.fullName}
          </p>
        </div>
        {/* <Link href="/dashboard/student/notifications">
          <Button variant="outline" className="relative">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </Badge>
            )}
          </Button>
        </Link> */}
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Documents
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDocuments}</div>
            <p className="text-xs text-muted-foreground">
              Thesis documents uploaded
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.approvedDocuments}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.totalDocuments > 0
                ? Math.round(
                    (stats.approvedDocuments / stats.totalDocuments) * 100
                  )
                : 0}
              % approval rate
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Review
            </CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.pendingDocuments}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting staff/admin review
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <Globe className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.publishedDocuments}
            </div>
            <p className="text-xs text-muted-foreground">
              Available in archive
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats Row */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.rejectedDocuments}
            </div>
            <p className="text-xs text-muted-foreground">Documents rejected</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Revision Required
            </CardTitle>
            <RefreshCw className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.revisionRequired}
            </div>
            <p className="text-xs text-muted-foreground">Needs revision</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Storage</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatFileSize(stats.totalFileSize)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total file size uploaded
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Review Time
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.averageReviewTime > 0
                ? `${stats.averageReviewTime}`
                : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.averageReviewTime > 0 ? "days" : "No reviews yet"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <StudentDashboardCharts
        statusDistribution={statusDistribution}
        monthlySubmissions={monthlySubmissions}
      />

      {/* Quick Actions */}
      {/* <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common student tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              <Link href="/dashboard/student/notifications">
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto py-3 relative"
                >
                  <Bell className="mr-3 h-5 w-5" />
                  <div className="text-left flex-1">
                    <div className="font-semibold">Notifications</div>
                    <div className="text-xs text-muted-foreground font-normal">
                      View your thesis and book request updates
                    </div>
                  </div>
                  {unreadCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="ml-2 h-5 min-w-5 flex items-center justify-center px-1.5 text-xs"
                    >
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </Badge>
                  )}
                </Button>
              </Link>
              <Link href="/dashboard/student/upload-documents">
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto py-3"
                >
                  <FileText className="mr-3 h-5 w-5" />
                  <div className="text-left">
                    <div className="font-semibold">Upload Documents</div>
                    <div className="text-xs text-muted-foreground font-normal">
                      Upload and manage your thesis documents
                    </div>
                  </div>
                </Button>
              </Link>
              <Link href="/dashboard/student/books">
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto py-3"
                >
                  <BookOpen className="mr-3 h-5 w-5" />
                  <div className="text-left">
                    <div className="font-semibold">Books</div>
                    <div className="text-xs text-muted-foreground font-normal">
                      Browse and request books from the library
                    </div>
                  </div>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your Account Details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Role:</span>
                <Badge variant="secondary">{session.user.userRole}</Badge>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Status:</span>
                <Badge
                  variant={
                    session.user.status === "Active"
                      ? "default"
                      : session.user.status === "Suspended"
                      ? "destructive"
                      : "secondary"
                  }
                >
                  {session.user.status}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium">{session.user.email}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div> */}
    </div>
  );
}
