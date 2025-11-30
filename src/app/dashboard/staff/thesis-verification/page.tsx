import { requireStaffOrAbove } from "@/lib/auth-library";
import { getThesisDocumentsForReview } from "./actions";
import { StaffThesisVerificationTable } from "@/components/staff/staff-thesis-verification-table";
import { FileCheck } from "lucide-react";

export default async function ThesisVerificationPage() {
  const session = await requireStaffOrAbove();
  const documents = await getThesisDocumentsForReview();

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <FileCheck className="h-8 w-8 text-primary" />
            <h2 className="text-3xl font-bold tracking-tight">Thesis Verification Panel</h2>
          </div>
          <p className="text-muted-foreground">
            Review and verify student thesis documents. Approve or request revisions as needed.
          </p>
        </div>
      </div>

      {/* Table with Filters */}
      <div className="space-y-4">
        <StaffThesisVerificationTable documents={documents} />
      </div>
    </div>
  );
}

