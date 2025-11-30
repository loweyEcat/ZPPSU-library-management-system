import { requireAdminOrSuperAdmin } from "@/lib/auth-library";
import { getAllBooks, getAllBookRequests } from "./actions";
import { CreateBookDialog } from "@/components/admin/create-book-dialog";
import { AdminBooksTabs } from "@/components/admin/admin-books-tabs";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

export default async function AdminBooksPage() {
  const session = await requireAdminOrSuperAdmin();
  const [books, requests] = await Promise.all([
    getAllBooks(),
    getAllBookRequests(),
  ]);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-primary" />
            <h2 className="text-3xl font-bold tracking-tight">
              Books Management
            </h2>
          </div>
          <p className="text-muted-foreground">
            View and manage all books and book requests in the library system.
            Search, filter, and edit book information.
          </p>
        </div>
        <CreateBookDialog />
      </div>

      {/* Tabs Section */}
      <Card className="border-2 shadow-sm">
        <CardContent className="p-6">
          <AdminBooksTabs books={books} requests={requests} />
        </CardContent>
      </Card>
    </div>
  );
}
