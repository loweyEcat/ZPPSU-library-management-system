import { requireStudent } from "@/lib/auth-library";
import { getStudentThesisDocuments } from "./actions";
import { ThesisDocumentsTable } from "@/components/student/thesis-documents-table";
import { UploadThesisDialogTrigger } from "@/components/student/upload-thesis-dialog";
import { FileText } from "lucide-react";

export default async function UploadDocumentsPage() {
  const session = await requireStudent();
  const documents = await getStudentThesisDocuments();

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <FileText className="h-8 w-8 text-primary" />
            <h2 className="text-3xl font-bold tracking-tight">Upload Documents</h2>
          </div>
          <p className="text-muted-foreground">
            Upload and manage your thesis documents. Documents will be reviewed by staff and admin.
          </p>
        </div>
        <div className="flex-shrink-0">
          <UploadThesisDialogTrigger />
        </div>
      </div>

      {/* Table with Filters */}
      <div className="space-y-4">
        <ThesisDocumentsTable documents={documents} uploaderName={session.user.fullName} />
      </div>
    </div>
  );
}

