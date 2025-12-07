import { requireAdminOrSuperAdmin } from "@/lib/auth-library";
import { getPublishedDocuments } from "./actions";
import { AdminPublishedDocumentsTable } from "@/components/admin/admin-published-documents-table";
import { Library } from "lucide-react";

export default async function AdminResourcesPage() {
  const session = await requireAdminOrSuperAdmin();
  const documents = await getPublishedDocuments();

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Library className="h-8 w-8 text-primary" />
            <h2 className="text-3xl font-bold tracking-tight">Published Resources</h2>
          </div>
          <p className="text-muted-foreground">
            View all published student documents including Journals, Thesis, and Capstone projects.
          </p>
        </div>
      </div>

      {/* Documents Table */}
      <div className="space-y-4">
        <AdminPublishedDocumentsTable documents={documents} />
      </div>
    </div>
  );
}

