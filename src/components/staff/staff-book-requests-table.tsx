"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MoreHorizontal,
  Search,
  BookOpen,
  User,
  Calendar,
  Package,
  Eye,
  CheckCircle2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Card, CardContent } from "@/components/ui/card";
import { VerifyBookDialog } from "@/components/staff/verify-book-dialog";

interface BookRequest {
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
  lib_book_fines?: Array<{
    id: number;
    reason: string;
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
    status: string | null;
  };
}

interface StaffBookRequestsTableProps {
  requests: BookRequest[];
  onRefresh?: () => void;
}

function formatStatus(
  status: string | null,
  quantity?: number | null,
  fines?: Array<{ reason: string; description: string | null }>
): string {
  if (!status) return "Unknown";

  // If status is "Received", calculate and show quantity
  if (status === "Received" && quantity) {
    // Calculate received quantity from fines
    let receivedQty = quantity;
    if (fines && fines.length > 0) {
      // Extract quantities from fine descriptions
      fines.forEach((fine) => {
        const qtyMatch = fine.description?.match(/Quantity:\s*(\d+)/i);
        if (qtyMatch) {
          receivedQty -= parseInt(qtyMatch[1]);
        } else {
          // If no quantity in description, assume 1 per fine
          receivedQty -= 1;
        }
      });
    }
    // Ensure receivedQty is at least 0
    receivedQty = Math.max(0, receivedQty);
    return `Received(${receivedQty})`;
  }

  return status.replace(/_/g, " ");
}

function getStatusVariant(
  status: string | null
): "default" | "secondary" | "destructive" {
  if (
    status === "Approved" ||
    status === "Returned" ||
    status === "Under_Review"
  )
    return "default";
  if (status === "Received") return "default"; // Will be styled with success color via className
  if (status === "Pending" || status === "Borrowed") return "secondary";
  if (status === "Overdue" || status === "Rejected") return "destructive";
  return "secondary";
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "N/A";
  }
}

const ITEMS_PER_PAGE = 15;

export function StaffBookRequestsTable({
  requests,
  onRefresh,
}: StaffBookRequestsTableProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [verifyDialogOpen, setVerifyDialogOpen] = React.useState(false);
  const [selectedRequest, setSelectedRequest] =
    React.useState<BookRequest | null>(null);

  // Filter requests based on search query and filters
  const filteredRequests = React.useMemo(() => {
    let filtered = requests;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((request) => {
        return (
          request.tracking_number.toLowerCase().includes(query) ||
          request.book.books_name.toLowerCase().includes(query) ||
          request.book.author_name.toLowerCase().includes(query) ||
          request.book.isbn.toLowerCase().includes(query) ||
          request.student.full_name.toLowerCase().includes(query) ||
          request.student.email.toLowerCase().includes(query) ||
          (request.student.student_id &&
            request.student.student_id.toLowerCase().includes(query))
        );
      });
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((request) => request.status === statusFilter);
    }

    return filtered;
  }, [requests, searchQuery, statusFilter]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredRequests.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedRequests = filteredRequests.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  // Calculate statistics
  const stats = React.useMemo(() => {
    const total = requests.length;
    const pending = requests.filter((r) => r.status === "Pending").length;
    const approved = requests.filter((r) => r.status === "Approved").length;
    const borrowed = requests.filter((r) => r.status === "Borrowed").length;
    const underReview = requests.filter(
      (r) => r.status === "Under_Review"
    ).length;
    const overdue = requests.filter((r) => r.status === "Overdue").length;
    const received = requests.filter((r) => r.status === "Received").length;

    return {
      total,
      pending,
      approved,
      borrowed,
      underReview,
      overdue,
      received,
    };
  }, [requests]);

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total Requests</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">
              {stats.pending}
            </div>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {stats.approved}
            </div>
            <p className="text-xs text-muted-foreground">Approved</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {stats.borrowed}
            </div>
            <p className="text-xs text-muted-foreground">Borrowed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">
              {stats.underReview}
            </div>
            <p className="text-xs text-muted-foreground">Under Review</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">
              {stats.overdue}
            </div>
            <p className="text-xs text-muted-foreground">Overdue</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {stats.received}
            </div>
            <p className="text-xs text-muted-foreground">Received</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by tracking number, book title, author, ISBN, student name, or email..."
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
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Approved">Approved</SelectItem>
            <SelectItem value="Borrowed">Borrowed</SelectItem>
            <SelectItem value="Returned">Returned</SelectItem>
            <SelectItem value="Under_Review">Under Review</SelectItem>
            <SelectItem value="Received">Received</SelectItem>
            <SelectItem value="Overdue">Overdue</SelectItem>
            <SelectItem value="Rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border-2 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="font-semibold">Tracking #</TableHead>
                <TableHead className="font-semibold">Book Name</TableHead>
                <TableHead className="font-semibold">Student</TableHead>
                <TableHead className="font-semibold">Request Date</TableHead>
                <TableHead className="font-semibold">Due Date</TableHead>
                <TableHead className="font-semibold">Date Returned</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="text-right font-semibold">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <Package className="h-12 w-12 text-muted-foreground/50" />
                      <p className="text-muted-foreground font-medium">
                        {searchQuery || statusFilter !== "all"
                          ? "No book requests found matching your filters."
                          : "No assigned book requests found."}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRequests.map((request) => (
                  <TableRow
                    key={request.id}
                    className="transition-colors hover:bg-muted/50"
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
                        <span className="text-xs text-muted-foreground font-mono">
                          ISBN: {request.book.isbn}
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
                        {request.student.student_id && (
                          <span className="text-xs text-muted-foreground">
                            ID: {request.student.student_id}
                          </span>
                        )}
                        {request.student.department && (
                          <span className="text-xs text-muted-foreground">
                            {request.student.department}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {request.request_date ? (
                        <div className="flex items-center gap-1.5 text-sm">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{formatDate(request.request_date)}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {request.due_date ? (
                        <div className="flex items-center gap-1.5 text-sm">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{formatDate(request.due_date)}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {request.return_date ? (
                        <div className="flex items-center gap-1.5 text-sm">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{formatDate(request.return_date)}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getStatusVariant(request.status)}
                        className={`font-medium ${
                          request.status === "Received"
                            ? "bg-green-600 hover:bg-green-700 text-white"
                            : ""
                        }`}
                      >
                        {formatStatus(
                          request.status,
                          request.quantity,
                          request.lib_book_fines
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem className="cursor-pointer">
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer">
                            <BookOpen className="mr-2 h-4 w-4" />
                            View Book Info
                          </DropdownMenuItem>
                          {(request.status === "Returned" ||
                            request.status === "Under_Review") &&
                            !request.has_fine && (
                              <DropdownMenuItem
                                className="cursor-pointer"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setVerifyDialogOpen(true);
                                }}
                              >
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Verify Book Return
                              </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
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
              {Math.min(endIndex, filteredRequests.length)}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-foreground">
              {filteredRequests.length}
            </span>{" "}
            requests
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

      {/* Verify Book Dialog */}
      {selectedRequest && (
        <VerifyBookDialog
          open={verifyDialogOpen}
          onOpenChange={setVerifyDialogOpen}
          request={selectedRequest}
          onSuccess={() => {
            setVerifyDialogOpen(false);
            setSelectedRequest(null);
            if (onRefresh) {
              onRefresh();
            } else {
              window.location.reload();
            }
          }}
        />
      )}
    </div>
  );
}
