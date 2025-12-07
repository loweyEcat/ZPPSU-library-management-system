import { requireStudent } from "@/lib/auth-library";
import { getPublishedDocumentsForStudent } from "./actions";
import { StudentResourcesTable } from "@/components/student/student-resources-table";
import { Library } from "lucide-react";

export default async function ResourcesPage() {
  const session = await requireStudent();
  const documents = await getPublishedDocumentsForStudent();

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Library className="h-8 w-8 text-primary" />
            <h2 className="text-3xl font-bold tracking-tight">
              Library Resources
            </h2>
          </div>
          <p className="text-muted-foreground">
            Browse all published student documents (Thesis, Journals, Capstone).
            Restricted documents are marked with a lock icon.
          </p>
        </div>
      </div>

      {/* Resources Table */}
      <div className="space-y-4">
        <StudentResourcesTable documents={documents} />
      </div>
    </div>
  );
}
