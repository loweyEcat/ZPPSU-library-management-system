import { requireAdminOrSuperAdmin } from "@/lib/auth-library";
import { getAllThesisDocuments } from "./actions";
import { AdminThesisVerificationTable } from "@/components/admin/admin-thesis-verification-table";
import {
  FileCheck,
  FileText,
  BookOpen,
  File,
  CheckCircle2,
  Clock,
  XCircle,
  Globe,
  Book,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminThesisVerificationPage() {
  const session = await requireAdminOrSuperAdmin();
  const documents = await getAllThesisDocuments();

  // Calculate stats
  const totalDocuments = documents.length;
  const thesisCount = documents.filter(
    (d) => d.document_type === "Thesis"
  ).length;
  const journalCount = documents.filter(
    (d) => d.document_type === "Journal"
  ).length;
  const capstoneCount = documents.filter(
    (d) => d.document_type === "Capstone"
  ).length;
  const ebookCount = documents.filter(
    (d) => d.document_type === "Ebooks"
  ).length;
  const pendingCount = documents.filter(
    (d) =>
      d.submission_status === "Under_Review" ||
      d.status === "Pending" ||
      d.status === "Under_Review"
  ).length;
  const staffVerifiedCount = documents.filter(
    (d) => d.submission_status === "Staff_Approved"
  ).length;
  const adminApprovedCount = documents.filter(
    (d) => d.submission_status === "Super_Admin_Approved"
  ).length;
  const publishedCount = documents.filter(
    (d) => d.submission_status === "Published"
  ).length;
  const rejectedCount = documents.filter(
    (d) =>
      d.submission_status === "Staff_Rejected" ||
      d.submission_status === "Super_Admin_Rejected"
  ).length;
  const totalFileSize = documents.reduce(
    (sum, d) => sum + (d.file_size || 0),
    0
  );

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <FileCheck className="h-8 w-8 text-primary" />
            <h2 className="text-3xl font-bold tracking-tight">
              Resources Verification Panel
            </h2>
          </div>
          <p className="text-muted-foreground">
            Review and verify all student thesis documents. Approve, reject, or
            publish documents as needed.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 border border-gray-200 rounded-lg p-4 bg-white">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Documents
            </CardTitle>
            <Book className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDocuments}</div>
            <p className="text-xs text-muted-foreground">All documents</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Thesis</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {thesisCount}
            </div>
            <p className="text-xs text-muted-foreground">Thesis documents</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Journals</CardTitle>
            <BookOpen className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {journalCount}
            </div>
            <p className="text-xs text-muted-foreground">Journal articles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Capstone</CardTitle>
            <File className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {capstoneCount}
            </div>
            <p className="text-xs text-muted-foreground">Capstone projects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ebooks</CardTitle>
            <BookOpen className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {ebookCount}
            </div>
            <p className="text-xs text-muted-foreground">Ebook collection</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {pendingCount}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Staff Verified
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {staffVerifiedCount}
            </div>
            <p className="text-xs text-muted-foreground">Verified by staff</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Admin Approved
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {adminApprovedCount}
            </div>
            <p className="text-xs text-muted-foreground">Approved by admin</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <Globe className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">
              {publishedCount}
            </div>
            <p className="text-xs text-muted-foreground">Published documents</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {rejectedCount}
            </div>
            <p className="text-xs text-muted-foreground">Rejected documents</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Size</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatFileSize(totalFileSize)}
            </div>
            <p className="text-xs text-muted-foreground">Total storage</p>
          </CardContent>
        </Card>
      </div>

      {/* Table with Filters */}
      <div className="space-y-4">
        <AdminThesisVerificationTable documents={documents} />
      </div>
    </div>
  );
}
