"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { lib_books_status } from "../../../generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  BookOpen,
  Eye,
  User,
  Hash,
  Building,
  Calendar,
  Copy,
  FileText,
  Package,
} from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ViewBookDialogForStudent } from "@/components/student/view-book-dialog";
import { Separator } from "../ui/separator";
import { RequestBookDialog } from "@/components/student/request-book-dialog";

interface Book {
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
  remaining_available_copies: number;
  status: lib_books_status;
  created_at: string | null;
  updated_at: string | null;
  has_active_request: boolean;
  student_request_status:
    | "Pending"
    | "Approved"
    | "Borrowed"
    | "Returned"
    | "Overdue"
    | "Rejected"
    | null;
}

interface StudentBooksTableProps {
  books: Book[];
  onRefresh?: () => void;
}

function formatStatus(status: lib_books_status): string {
  return status;
}

function getStatusVariant(
  status: lib_books_status
): "default" | "secondary" | "destructive" {
  if (status === "Available") return "default";
  if (status === "Not Available") return "secondary";
  return "destructive";
}

const ITEMS_PER_PAGE = 12;

export function StudentBooksTable({
  books,
  onRefresh,
}: StudentBooksTableProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = React.useState<string>("all");
  const [viewDialogOpen, setViewDialogOpen] = React.useState(false);
  const [requestDialogOpen, setRequestDialogOpen] = React.useState(false);
  const [selectedBookId, setSelectedBookId] = React.useState<number | null>(
    null
  );
  const [selectedBook, setSelectedBook] = React.useState<Book | null>(null);

  // Get unique departments for filter
  const departments = React.useMemo(() => {
    const deptSet = new Set<string>();
    books.forEach((book) => {
      if (book.department) deptSet.add(book.department);
    });
    return Array.from(deptSet).sort();
  }, [books]);

  // Filter books based on search query and filters
  const filteredBooks = React.useMemo(() => {
    let filtered = books;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((book) => {
        return (
          book.books_name.toLowerCase().includes(query) ||
          book.author_name.toLowerCase().includes(query) ||
          book.isbn.toLowerCase().includes(query) ||
          (book.publisher && book.publisher.toLowerCase().includes(query)) ||
          (book.subject && book.subject.toLowerCase().includes(query)) ||
          (book.department && book.department.toLowerCase().includes(query))
        );
      });
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((book) => book.status === statusFilter);
    }

    // Apply department filter
    if (departmentFilter !== "all") {
      filtered = filtered.filter(
        (book) => book.department === departmentFilter
      );
    }

    return filtered;
  }, [books, searchQuery, statusFilter, departmentFilter]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredBooks.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedBooks = filteredBooks.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, departmentFilter]);

  const handleView = (id: number) => {
    setSelectedBookId(id);
    setViewDialogOpen(true);
  };

  const handleRequestBook = (book: Book) => {
    setSelectedBook(book);
    setRequestDialogOpen(true);
  };

  const handleRequestSuccess = () => {
    setRequestDialogOpen(false);
    setSelectedBook(null);
    // Refresh the page to update the tabs
    window.location.reload();
  };

  // Calculate statistics
  const stats = React.useMemo(() => {
    const total = books.length;
    const available = books.filter((b) => b.status === "Available").length;
    const totalCopies = books.reduce(
      (sum, b) => sum + (b.total_copies || 0),
      0
    );
    const availableCopies = books.reduce(
      (sum, b) => sum + b.remaining_available_copies,
      0
    );

    return {
      total,
      available,
      totalCopies,
      availableCopies,
    };
  }, [books]);

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total Books</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {stats.available}
            </div>
            <p className="text-xs text-muted-foreground">Available</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.totalCopies}</div>
            <p className="text-xs text-muted-foreground">Total Copies</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {stats.availableCopies}
            </div>
            <p className="text-xs text-muted-foreground">Available Copies</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by title, author, ISBN, publisher, subject, or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-11 bg-background border-2 focus:border-primary transition-colors"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px] h-11 border-2">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Available">Available</SelectItem>
            <SelectItem value="Not Available">Not Available</SelectItem>
            <SelectItem value="Lost">Lost</SelectItem>
            <SelectItem value="Damaged">Damaged</SelectItem>
          </SelectContent>
        </Select>
        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
          <SelectTrigger className="w-full sm:w-[180px] h-11 border-2">
            <SelectValue placeholder="Filter by department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map((dept) => (
              <SelectItem key={dept} value={dept}>
                {dept}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Books Grid */}
      {paginatedBooks.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center gap-2">
              <BookOpen className="h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground font-medium">
                {searchQuery ||
                statusFilter !== "all" ||
                departmentFilter !== "all"
                  ? "No books found matching your filters."
                  : "No books found."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {paginatedBooks.map((book) => (
              <Card
                key={book.id}
                className="group flex flex-col hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 border-2 hover:border-primary/30 overflow-hidden relative bg-gradient-to-br from-background to-muted/20"
              >
                {/* Status Indicator Bar */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1 ${
                    book.status === "Available"
                      ? "bg-green-500"
                      : book.status === "Not Available"
                      ? "bg-orange-500"
                      : "bg-red-500"
                  }`}
                />

                {/* Label Badge */}
                {/* {(book.books_category || book.books_type) && (
                  <div className="absolute top-2 right-2 z-10">
                    <Badge
                      variant="secondary"
                      className="text-xs font-medium px-2 py-0.5 bg-primary/10 text-primary border-primary/20"
                    >
                      {book.books_category || book.books_type || "Book"}
                    </Badge>
                  </div>
                )} */}

                <CardHeader className="pb-3 pt-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg font-bold line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                        {book.books_name}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1.5 text-sm">
                        <div className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-primary" />
                          <span className="text-xs text-muted-foreground font-medium">
                            Author:
                          </span>
                        </div>
                        <span className="truncate font-medium">
                          {book.author_name}
                        </span>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-3">
                  <div className="space-y-2.5 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground ">
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Hash className="h-3.5 w-3.5 text-primary" />
                        <span className="text-xs font-medium">ISBN:</span>
                      </div>
                      <span className="font-mono text-xs truncate">
                        {book.isbn}
                      </span>
                    </div>
                    {book.publication_year && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Calendar className="h-3.5 w-3.5 text-primary" />
                          <span className="text-xs font-medium">Year:</span>
                        </div>
                        <span className="text-xs">{book.publication_year}</span>
                      </div>
                    )}
                    {book.department && (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Building className="h-3.5 w-3.5 text-primary" />
                          <span className="text-xs font-medium text-muted-foreground">
                            Dept:
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {book.department}
                        </span>
                      </div>
                    )}
                    {book.publisher && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <div className="flex items-center gap-1.5 shrink-0">
                          <FileText className="h-3.5 w-3.5 text-primary" />
                          <span className="text-xs font-medium">
                            Publisher:
                          </span>
                        </div>
                        <span className="truncate text-xs">
                          {book.publisher}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border/50">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <Copy className="h-4 w-4 text-primary" />
                        <span className="text-xs font-medium text-muted-foreground">
                          Copies:
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {book.remaining_available_copies} /{" "}
                          {book.total_copies ?? 0}
                        </span>
                        {book.remaining_available_copies <
                          (book.available_copies ?? 0) && (
                          <span className="text-xs text-muted-foreground">
                            ({book.available_copies ?? 0} total available)
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge
                      variant={getStatusVariant(book.status)}
                      className="font-medium text-xs px-2.5 py-1"
                    >
                      {formatStatus(book.status)}
                    </Badge>
                  </div>

                  {book.has_active_request && (
                    <div className="pt-2 border-t border-border/50">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          Your Request:
                        </span>
                        <Badge
                          variant={
                            book.student_request_status === "Borrowed"
                              ? "default"
                              : book.student_request_status === "Approved"
                              ? "default"
                              : "secondary"
                          }
                          className="text-xs"
                        >
                          {book.student_request_status}
                        </Badge>
                      </div>
                    </div>
                  )}
                </CardContent>
                {book.description && (
                  <CardFooter className="pt-0 pb-4 flex flex-col gap-2 items-start">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-sm font-normal">
                        Description:
                      </span>
                    </div>
                    <Separator />
                    <p className="text-xs text-muted-foreground line-clamp-2 italic">
                      "{book.description}"
                    </p>
                  </CardFooter>
                )}
                <CardFooter className="pt-4 pb-4 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleView(book.id)}
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleRequestBook(book)}
                    disabled={
                      book.status !== "Available" ||
                      book.remaining_available_copies <= 0 ||
                      book.has_active_request
                    }
                    className="flex-1"
                  >
                    {book.has_active_request ? (
                      <>
                        <Package className="mr-2 h-4 w-4" />
                        Requested
                      </>
                    ) : (
                      <>
                        <Package className="mr-2 h-4 w-4" />
                        Request to Borrow
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
              <div className="text-sm text-muted-foreground font-medium">
                Showing{" "}
                <span className="font-semibold text-foreground">
                  {startIndex + 1}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-foreground">
                  {Math.min(endIndex, filteredBooks.length)}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-foreground">
                  {filteredBooks.length}
                </span>{" "}
                books
              </div>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) setCurrentPage(currentPage - 1);
                      }}
                      className={
                        currentPage === 1
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(page);
                          }}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  )}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < totalPages)
                          setCurrentPage(currentPage + 1);
                      }}
                      className={
                        currentPage === totalPages
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}

      {/* View Book Dialog */}
      <ViewBookDialogForStudent
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        bookId={selectedBookId}
      />

      {/* Request Book Dialog */}
      <RequestBookDialog
        open={requestDialogOpen}
        onOpenChange={setRequestDialogOpen}
        book={selectedBook}
        onSuccess={handleRequestSuccess}
      />
    </div>
  );
}
