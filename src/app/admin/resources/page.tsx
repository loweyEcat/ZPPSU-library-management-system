import { requireAdminOrSuperAdmin } from "@/lib/auth-library";
import { getPublishedDocuments } from "./actions";
import { AdminPublishedDocumentsTable } from "@/components/admin/admin-published-documents-table";
import { AdminUploadEbookDialogTrigger } from "@/components/admin/admin-upload-ebook-dialog";
import {
  Library,
  FileText,
  BookOpen,
  File,
  Lock,
  Book,
  EyeOff,
  Eye,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminResourcesPage() {
  const session = await requireAdminOrSuperAdmin();
  const documents = await getPublishedDocuments();

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
  const restrictedCount = documents.filter((d) => d.is_restricted).length;
  const hiddenCount = documents.filter((d) => d.is_hidden).length;
  const visibleCount = totalDocuments - hiddenCount;
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
            <Library className="h-8 w-8 text-primary" />
            <h2 className="text-3xl font-bold tracking-tight">
              Published Resources
            </h2>
          </div>
          <p className="text-muted-foreground">
            View all published student documents including Journals, Thesis,
            Capstone, and Ebooks.
          </p>
        </div>
        <div className="flex-shrink-0">
          <AdminUploadEbookDialogTrigger />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-9">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Resources
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
            <CardTitle className="text-sm font-medium">Restricted</CardTitle>
            <Lock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {restrictedCount}
            </div>
            <p className="text-xs text-muted-foreground">Restricted access</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visible</CardTitle>
            <Eye className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {visibleCount}
            </div>
            <p className="text-xs text-muted-foreground">Visible to students</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hidden</CardTitle>
            <EyeOff className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {hiddenCount}
            </div>
            <p className="text-xs text-muted-foreground">
              Hidden from students
            </p>
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

      {/* Documents Table */}
      <div className="space-y-4">
        <AdminPublishedDocumentsTable documents={documents} />
      </div>
    </div>
  );
}
