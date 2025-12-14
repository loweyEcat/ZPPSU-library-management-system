import { requireStaffOrAbove } from "@/lib/auth-library";
import { getThesisDocumentsForReview } from "./actions";
import { StaffThesisVerificationTable } from "@/components/staff/staff-thesis-verification-table";
import {
  FileCheck,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ThesisVerificationPage() {
  const session = await requireStaffOrAbove();
  const documents = await getThesisDocumentsForReview();

  // Calculate stats
  const totalDocuments = documents.length;
  const pendingCount = documents.filter(
    (doc) =>
      doc.submission_status === "Under_Review" ||
      doc.status === "Pending" ||
      doc.status === "Under_Review"
  ).length;
  const approvedCount = documents.filter(
    (doc) => doc.submission_status === "Staff_Approved"
  ).length;
  const rejectedCount = documents.filter(
    (doc) => doc.submission_status === "Staff_Rejected"
  ).length;
  const revisionCount = documents.filter(
    (doc) => doc.submission_status === "Revision_Requested"
  ).length;

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
            Review and verify student thesis documents. Approve or request
            revisions as needed.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Documents
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDocuments}</div>
            <p className="text-xs text-muted-foreground">All documents</p>
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
              {pendingCount}
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
              {approvedCount}
            </div>
            <p className="text-xs text-muted-foreground">Staff verified</p>
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
            <CardTitle className="text-sm font-medium">
              Revision Required
            </CardTitle>
            <RefreshCw className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {revisionCount}
            </div>
            <p className="text-xs text-muted-foreground">Needs revision</p>
          </CardContent>
        </Card>
      </div>

      {/* Table with Filters */}
      <div className="space-y-4">
        <StaffThesisVerificationTable documents={documents} />
      </div>
    </div>
  );
}
