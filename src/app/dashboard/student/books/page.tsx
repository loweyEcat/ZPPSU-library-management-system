import { requireStudent } from "@/lib/auth-library";
import {
  getAllBooksForStudent,
  getStudentBookRequests,
  getStudentFines,
} from "./actions";
import { StudentBooksTable } from "@/components/student/student-books-table";
import { StudentBookRequestsTable } from "@/components/student/student-book-requests-table";
import { StudentFinesTable } from "@/components/student/student-fines-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Package, DollarSign } from "lucide-react";

export default async function BooksPage() {
  const session = await requireStudent();
  const [books, requests, fines] = await Promise.all([
    getAllBooksForStudent(),
    getStudentBookRequests(),
    getStudentFines(),
  ]);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-primary" />
            <h2 className="text-3xl font-bold tracking-tight">Library Books</h2>
          </div>
          <p className="text-muted-foreground">
            Browse available books and request to borrow from the library
          </p>
        </div>
      </div>

      {/* Tabs Section */}
      <Card className="border-2 shadow-sm">
        <CardContent className="p-6">
          <Tabs defaultValue="books" className="w-full">
            <TabsList className="grid w-full max-w-2xl grid-cols-3 mb-6">
              <TabsTrigger value="books" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Books ({books.length})
              </TabsTrigger>
              <TabsTrigger value="requests" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Requested Books ({requests.length})
              </TabsTrigger>
              <TabsTrigger value="fines" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Damaged/Lost ({fines.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="books" className="space-y-4 mt-0">
              <StudentBooksTable books={books} />
            </TabsContent>

            <TabsContent value="requests" className="space-y-4 mt-0">
              <StudentBookRequestsTable requests={requests} />
            </TabsContent>

            <TabsContent value="fines" className="space-y-4 mt-0">
              {fines.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center gap-2 py-8">
                      <DollarSign className="h-12 w-12 text-muted-foreground/50" />
                      <p className="text-muted-foreground font-medium">
                        No fines found
                      </p>
                      <p className="text-sm text-muted-foreground">
                        You currently have no fines for damaged or lost books
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <StudentFinesTable fines={fines} />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
