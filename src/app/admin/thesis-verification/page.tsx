import { requireAdminOrSuperAdmin } from "@/lib/auth-library";
import { getAllThesisDocuments } from "./actions";
import { AdminThesisVerificationTable } from "@/components/admin/admin-thesis-verification-table";
import { FileCheck } from "lucide-react";

export default async function AdminThesisVerificationPage() {
  const session = await requireAdminOrSuperAdmin();
  const documents = await getAllThesisDocuments();

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <FileCheck className="h-8 w-8 text-primary" />
            <h2 className="text-3xl font-bold tracking-tight">
              Documents Verification Panel
            </h2>
          </div>
          <p className="text-muted-foreground">
            Review and verify all student thesis documents. Approve, reject, or
            publish documents as needed.
          </p>
        </div>
      </div>

      {/* Table with Filters */}
      <div className="space-y-4">
        <AdminThesisVerificationTable documents={documents} />
      </div>
    </div>
  );
}
