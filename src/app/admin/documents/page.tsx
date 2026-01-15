import { requireSuperAdmin } from "@/lib/auth-library";
import { getDownloadPermissionRequests } from "./actions";
import { DownloadRequestTable } from "@/components/admin/download-request-table";
import { Download } from "lucide-react";

export default async function AdminDocumentsPage() {
  await requireSuperAdmin();
  const requests = await getDownloadPermissionRequests();

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Download className="h-8 w-8 text-primary" />
            <h2 className="text-3xl font-bold tracking-tight">
              Viewing Request Panel
            </h2>
          </div>
          <p className="text-muted-foreground">
            Review and manage student viewing permission requests for resources.
          </p>
        </div>
      </div>

      {/* Requests Table */}
      <div className="space-y-4">
        <DownloadRequestTable requests={requests} />
      </div>
    </div>
  );
}
