import { requireStaffOrAbove } from "@/lib/auth-library";
import { getAssignedBookRequests, getBooksWithFines } from "./actions";
import { StaffBookRequestsTable } from "@/components/staff/staff-book-requests-table";
import { BooksWithFinesTable } from "@/components/staff/books-with-fines-table";
import { BookOpen, DollarSign } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function BooksRequestedPage() {
  const session = await requireStaffOrAbove();
  const [requests, fines] = await Promise.all([
    getAssignedBookRequests(),
    getBooksWithFines(),
  ]);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-primary" />
            <h2 className="text-3xl font-bold tracking-tight">
              Assigned Book Requests
            </h2>
          </div>
          <p className="text-muted-foreground">
            View and manage book requests assigned to you from students
          </p>
        </div>
      </div>

      {/* Tabs Section */}
      <Card className="border-2 shadow-sm">
        <CardContent className="p-6">
          <Tabs defaultValue="requests" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
              <TabsTrigger value="requests" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Book Requests ({requests.length})
              </TabsTrigger>
              <TabsTrigger value="fines" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Damaged/Lost Books ({fines.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="requests" className="space-y-4 mt-0">
              {requests.length === 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>No Assigned Requests</CardTitle>
                    <CardDescription>
                      You currently have no book requests assigned to you
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      When an administrator approves a book request and assigns
                      it to you, it will appear here.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <StaffBookRequestsTable requests={requests} />
              )}
            </TabsContent>

            <TabsContent value="fines" className="space-y-4 mt-0">
              {fines.length === 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>No Fines Found</CardTitle>
                    <CardDescription>
                      You currently have no fines for damaged or lost books
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      When you verify returned books and find damages or losses,
                      fines will appear here.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <BooksWithFinesTable fines={fines} />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

