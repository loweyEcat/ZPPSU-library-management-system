"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AdminBooksTable } from "./admin-books-table";
import { AdminBookRequestsTable } from "./admin-book-requests-table";
import { BookOpen, Package, AlertTriangle } from "lucide-react";

interface AdminBooksTabsProps {
  books: Array<{
    id: number;
    books_name: string;
    author_name: string;
    isbn: string;
    publisher: string | null;
    publication_year: number | null;
    edition: string | null;
    subject: string | null;
    department: string | null;
    books_type: string | null;
    books_category: string | null;
    description: string | null;
    language: string | null;
    classification_code: string | null;
    shelf_location: string | null;
    format: string | null;
    total_copies: number | null;
    available_copies: number | null;
    status: "Available" | "Not_Available" | "Lost" | "Damaged";
    created_at: string | null;
    updated_at: string | null;
    total_requests: number;
    active_requests: number;
    damaged_quantity?: number;
    lost_quantity?: number;
  }>;
  requests: Array<{
    id: number;
    student_id: number;
    staff_id: number | null;
    book_id: number;
    tracking_number: string;
    quantity: number | null;
    request_date: string | null;
    approved_date: string | null;
    borrow_date: string | null;
    due_date: string | null;
    return_date: string | null;
    status:
      | "Pending"
      | "Approved"
      | "Borrowed"
      | "Returned"
      | "Under_Review"
      | "Received"
      | "Overdue"
      | "Rejected"
      | null;
    has_fine?: boolean;
    fine_reason?: "Damaged" | "Lost" | null;
    fine_status?: "Unpaid" | "Paid" | "Waived" | "Partially_Paid" | null;
    lib_book_fines?: Array<{
      id: number;
      reason: string;
      status: string;
      description: string | null;
    }>;
    created_at: string | null;
    updated_at: string | null;
    student: {
      id: number;
      full_name: string;
      email: string;
      student_id: string | null;
      year_level: string | null;
      department: string | null;
    };
    staff: {
      id: number;
      full_name: string;
      email: string;
    } | null;
    book: {
      id: number;
      books_name: string;
      author_name: string;
      isbn: string;
    };
  }>;
}

// Helper function to extract quantity from fine description
function extractQuantityFromDescription(description: string | null): number {
  if (!description) return 0;
  const match = description.match(/Quantity:\s*(\d+)/i);
  return match ? parseInt(match[1]) : 0;
}

// Helper function to get payment status from fines
function getPaymentStatus(fines: Array<{ status: string }> | undefined): {
  status: string;
  variant: "default" | "secondary" | "destructive" | "outline";
} {
  if (!fines || fines.length === 0) {
    return { status: "N/A", variant: "outline" };
  }

  const allPaid = fines.every((f) => f.status === "Paid");
  const allUnpaid = fines.every((f) => f.status === "Unpaid");
  const hasPartiallyPaid = fines.some(
    (f) => f.status === "Partially_Paid" || f.status === "Partially Paid"
  );
  const hasWaived = fines.some((f) => f.status === "Waived");

  if (hasWaived) {
    return { status: "Waived", variant: "secondary" };
  }
  if (allPaid) {
    return { status: "Paid", variant: "default" };
  }
  if (hasPartiallyPaid) {
    return { status: "Partially Paid", variant: "secondary" };
  }
  if (allUnpaid) {
    return { status: "Unpaid", variant: "destructive" };
  }

  // Mixed status
  return { status: "Mixed", variant: "outline" };
}

export function AdminBooksTabs({ books, requests }: AdminBooksTabsProps) {
  // Extract unique book IDs that have been damaged or lost from requests with fines
  const damagedBookIds = new Set<number>();
  const lostBookIds = new Set<number>();

  requests.forEach((request) => {
    if (request.lib_book_fines && request.lib_book_fines.length > 0) {
      request.lib_book_fines.forEach((fine) => {
        if (fine.reason === "Damaged") {
          damagedBookIds.add(request.book_id);
        } else if (fine.reason === "Lost") {
          lostBookIds.add(request.book_id);
        }
      });
    }
  });

  // Filter books that have been damaged or lost
  const allBooks = books.filter(
    (book) => book.status !== "Damaged" && book.status !== "Lost"
  );
  const damagedBooks = books.filter(
    (book) => book.status === "Damaged" || damagedBookIds.has(book.id)
  );
  const lostBooks = books.filter(
    (book) => book.status === "Lost" || lostBookIds.has(book.id)
  );

  // Remove duplicates
  const uniqueDamagedBooks = Array.from(
    new Map(damagedBooks.map((book) => [book.id, book])).values()
  );
  const uniqueLostBooks = Array.from(
    new Map(lostBooks.map((book) => [book.id, book])).values()
  );

  return (
    <Tabs defaultValue="requests" className="w-full">
      <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
        <TabsTrigger value="requests" className="flex items-center gap-2">
          <Package className="h-4 w-4" />
          Books Request ({requests.length})
        </TabsTrigger>
        <TabsTrigger value="books" className="flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          Books ({books.length})
        </TabsTrigger>
      </TabsList>
      <TabsContent value="requests" className="space-y-4 mt-0">
        <AdminBookRequestsTable requests={requests} />
      </TabsContent>
      <TabsContent value="books" className="space-y-4 mt-0">
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-3 mb-6">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              All Books ({allBooks.length})
            </TabsTrigger>
            <TabsTrigger value="damaged" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Damaged (
              {
                requests.filter((r) =>
                  r.lib_book_fines?.some((f) => f.reason === "Damaged")
                ).length
              }
              )
            </TabsTrigger>
            <TabsTrigger value="lost" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Lost (
              {
                requests.filter((r) =>
                  r.lib_book_fines?.some((f) => f.reason === "Lost")
                ).length
              }
              )
            </TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="space-y-4 mt-0">
            <AdminBooksTable books={allBooks} />
          </TabsContent>
          <TabsContent value="damaged" className="space-y-4 mt-0">
            {(() => {
              // Filter requests that have damaged fines
              const damagedRequests = requests.filter((request) => {
                if (
                  !request.lib_book_fines ||
                  request.lib_book_fines.length === 0
                ) {
                  return false;
                }
                return request.lib_book_fines.some(
                  (fine) => fine.reason === "Damaged"
                );
              });

              if (damagedRequests.length === 0) {
                return (
                  <div className="flex flex-col items-center gap-2 py-8">
                    <AlertTriangle className="h-12 w-12 text-muted-foreground/50" />
                    <p className="text-muted-foreground font-medium">
                      No damaged books found
                    </p>
                    <p className="text-sm text-muted-foreground">
                      There are no book requests with damaged books
                    </p>
                  </div>
                );
              }

              return (
                <div className="rounded-lg border-2 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                          <TableHead className="font-semibold">
                            Tracking #
                          </TableHead>
                          <TableHead className="font-semibold">
                            Book Name
                          </TableHead>
                          <TableHead className="font-semibold">
                            Student
                          </TableHead>
                          <TableHead className="text-center font-semibold">
                            Quantity Borrowed
                          </TableHead>
                          <TableHead className="text-center font-semibold">
                            Damaged Quantity
                          </TableHead>
                          <TableHead className="text-center font-semibold">
                            Received Quantity
                          </TableHead>
                          <TableHead className="font-semibold">
                            Payment Status
                          </TableHead>
                          <TableHead className="font-semibold">
                            Status
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {damagedRequests.map((request) => {
                          const damagedFines =
                            request.lib_book_fines?.filter(
                              (f) => f.reason === "Damaged"
                            ) || [];
                          const damagedQty = damagedFines.reduce(
                            (sum, f) =>
                              sum +
                              extractQuantityFromDescription(f.description),
                            0
                          );
                          const totalQty = request.quantity || 1;
                          const allFines = request.lib_book_fines || [];
                          const totalDamagedLostQty = allFines.reduce(
                            (sum, f) =>
                              sum +
                              extractQuantityFromDescription(f.description),
                            0
                          );
                          const receivedQty = Math.max(
                            0,
                            totalQty - totalDamagedLostQty
                          );
                          const paymentStatus = getPaymentStatus(damagedFines);

                          return (
                            <TableRow
                              key={request.id}
                              className="hover:bg-muted/50 transition-colors"
                            >
                              <TableCell className="font-mono text-sm font-medium">
                                {request.tracking_number}
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {request.book.books_name}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {request.book.author_name}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {request.student.full_name}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {request.student.email}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-center font-medium">
                                {totalQty}
                              </TableCell>
                              <TableCell className="text-center font-medium text-orange-600">
                                {damagedQty}
                              </TableCell>
                              <TableCell className="text-center font-medium text-green-600">
                                {receivedQty > 0 ? receivedQty : "-"}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={paymentStatus.variant}
                                  className={`font-medium ${
                                    paymentStatus.status === "Paid"
                                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                                      : ""
                                  }`}
                                >
                                  {paymentStatus.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                                  Damaged
                                </span>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              );
            })()}
          </TabsContent>
          <TabsContent value="lost" className="space-y-4 mt-0">
            {(() => {
              // Filter requests that have lost fines
              const lostRequests = requests.filter((request) => {
                if (
                  !request.lib_book_fines ||
                  request.lib_book_fines.length === 0
                ) {
                  return false;
                }
                return request.lib_book_fines.some(
                  (fine) => fine.reason === "Lost"
                );
              });

              if (lostRequests.length === 0) {
                return (
                  <div className="flex flex-col items-center gap-2 py-8">
                    <AlertTriangle className="h-12 w-12 text-muted-foreground/50" />
                    <p className="text-muted-foreground font-medium">
                      No lost books found
                    </p>
                    <p className="text-sm text-muted-foreground">
                      There are no book requests with lost books
                    </p>
                  </div>
                );
              }

              return (
                <div className="rounded-lg border-2 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                          <TableHead className="font-semibold">
                            Tracking #
                          </TableHead>
                          <TableHead className="font-semibold">
                            Book Name
                          </TableHead>
                          <TableHead className="font-semibold">
                            Student
                          </TableHead>
                          <TableHead className="text-center font-semibold">
                            Quantity Borrowed
                          </TableHead>
                          <TableHead className="text-center font-semibold">
                            Lost Quantity
                          </TableHead>
                          <TableHead className="text-center font-semibold">
                            Received Quantity
                          </TableHead>
                          <TableHead className="font-semibold">
                            Payment Status
                          </TableHead>
                          <TableHead className="font-semibold">
                            Status
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {lostRequests.map((request) => {
                          const lostFines =
                            request.lib_book_fines?.filter(
                              (f) => f.reason === "Lost"
                            ) || [];
                          const lostQty = lostFines.reduce(
                            (sum, f) =>
                              sum +
                              extractQuantityFromDescription(f.description),
                            0
                          );
                          const totalQty = request.quantity || 1;
                          const allFines = request.lib_book_fines || [];
                          const totalDamagedLostQty = allFines.reduce(
                            (sum, f) =>
                              sum +
                              extractQuantityFromDescription(f.description),
                            0
                          );
                          const receivedQty = Math.max(
                            0,
                            totalQty - totalDamagedLostQty
                          );
                          const paymentStatus = getPaymentStatus(lostFines);

                          return (
                            <TableRow
                              key={request.id}
                              className="hover:bg-muted/50 transition-colors"
                            >
                              <TableCell className="font-mono text-sm font-medium">
                                {request.tracking_number}
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {request.book.books_name}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {request.book.author_name}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {request.student.full_name}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {request.student.email}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-center font-medium">
                                {totalQty}
                              </TableCell>
                              <TableCell className="text-center font-medium text-red-600">
                                {lostQty}
                              </TableCell>
                              <TableCell className="text-center font-medium text-green-600">
                                {receivedQty > 0 ? receivedQty : "-"}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={paymentStatus.variant}
                                  className={`font-medium ${
                                    paymentStatus.status === "Paid"
                                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                                      : ""
                                  }`}
                                >
                                  {paymentStatus.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                  Lost
                                </span>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              );
            })()}
          </TabsContent>
        </Tabs>
      </TabsContent>
    </Tabs>
  );
}
