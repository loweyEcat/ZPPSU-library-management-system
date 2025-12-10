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
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
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
import { ApproveBookRequestDialog } from "./approve-book-request-dialog";
import { ViewBookRequestDetailsDialog } from "./view-book-request-details-dialog";

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
}

interface AdminBookRequestsTableProps {
  requests: BookRequest[];
  onRefresh?: () => void;
}

function formatStatus(status: string | null): string {
  if (!status) return "Unknown";
  return status.replace(/_/g, " ");
}

function getStatusVariant(
  status: string | null,
  hasFine?: boolean,
  fineReason?: "Damaged" | "Lost" | null,
  fineStatus?: "Unpaid" | "Paid" | "Waived" | "Partially_Paid" | null,
  displayStatus?: string
): "default" | "secondary" | "destructive" {
  // Check display status first (handles "Settled(X)" and "Received(X)")
  if (displayStatus) {
    if (displayStatus.startsWith("Settled")) {
      return "default"; // Will be styled with blue color via className
    }
    if (displayStatus.startsWith("Received")) {
      return "default"; // Will be styled with success color via className
    }
    if (displayStatus === "Damaged") {
      return "secondary";
    }
    if (displayStatus === "Lost") {
      return "destructive";
    }
  }

  // If there's a fine and it's paid, show "Settled" with success color
  if (hasFine && fineStatus === "Paid") {
    return "default"; // Will be styled with success color via className
  }
  // If there's a fine and it's not paid, show the fine reason status
  if (hasFine && fineReason) {
    return fineReason === "Damaged" ? "secondary" : "destructive";
  }
  // If status is Received, it will be styled with success color via className
  if (status === "Received") return "default";
  if (status === "Approved" || status === "Returned") return "default";
  if (status === "Pending" || status === "Borrowed") return "secondary";
  if (status === "Overdue" || status === "Rejected") return "destructive";
  return "secondary";
}

// Extract quantity from fine description (format: "Description (Quantity: X)")
function extractQuantityFromDescription(description: string | null): number {
  if (!description) return 1; // Default to 1 if no description
  const match = description.match(/Quantity:\s*(\d+)/i);
  return match ? parseInt(match[1]) : 1;
}

function getDisplayStatus(
  status: string | null,
  quantity: number | null,
  hasFine?: boolean,
  fineReason?: "Damaged" | "Lost" | null,
  fineStatus?: "Unpaid" | "Paid" | "Waived" | "Partially_Paid" | null,
  fines?: Array<{ reason: string; status: string; description: string | null }>
): string {
  const totalQty = quantity || 1;

  // If there's a fine and it's paid, show "Settled(X)" where X is the quantity of settled books
  if (hasFine && fineStatus === "Paid" && fines) {
    const settledQty = fines
      .filter((f) => f.status === "Paid")
      .reduce(
        (sum, f) => sum + extractQuantityFromDescription(f.description),
        0
      );
    return settledQty > 0 ? `Settled(${settledQty})` : "Settled";
  }

  // If there's a fine and it's not paid, show the fine reason
  if (hasFine && fineReason) {
    return fineReason;
  }

  // If status is "Received", calculate and show quantity
  if (status === "Received" && fines) {
    const damagedLostQty = fines.reduce((sum, f) => {
      return sum + extractQuantityFromDescription(f.description);
    }, 0);
    const receivedQty = Math.max(0, totalQty - damagedLostQty);
    return receivedQty > 0 ? `Received(${receivedQty})` : "Received";
  }

  // Otherwise show the request status
  return formatStatus(status);
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

export function AdminBookRequestsTable({
  requests,
  onRefresh,
}: AdminBookRequestsTableProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [approveDialogOpen, setApproveDialogOpen] = React.useState(false);
  const [viewDetailsDialogOpen, setViewDetailsDialogOpen] =
    React.useState(false);
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
            request.student.student_id.toLowerCase().includes(query)) ||
          (request.staff &&
            request.staff.full_name.toLowerCase().includes(query))
        );
      });
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((request) => {
        // If filtering by Settled, check if fine is paid
        if (statusFilter === "Settled") {
          return request.has_fine && request.fine_status === "Paid";
        }
        // If filtering by Damaged or Lost, check fine_reason and ensure it's not paid
        if (statusFilter === "Damaged" || statusFilter === "Lost") {
          return (
            request.has_fine &&
            request.fine_reason === statusFilter &&
            request.fine_status !== "Paid"
          );
        }
        // For other statuses, check the request status
        // But if there's a fine, the display status would be the fine reason or Settled, so exclude those
        if (request.has_fine) {
          return false; // Fines are handled separately above
        }
        // For "Received" status, check if status is "Received"
        if (statusFilter === "Received") {
          return request.status === "Received";
        }
        // For other statuses, check the request status
        return request.status === statusFilter;
      });
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

    // Count books (quantity) instead of requests
    const overdue = requests
      .filter((r) => r.status === "Overdue")
      .reduce((sum, r) => sum + (r.quantity || 1), 0);

    const received = requests
      .filter((r) => r.status === "Received")
      .reduce((sum, r) => {
        // For received, calculate received quantity (total - damaged/lost)
        if (r.lib_book_fines && r.lib_book_fines.length > 0) {
          const damagedLostQty = r.lib_book_fines.reduce(
            (fineSum, f) =>
              fineSum + extractQuantityFromDescription(f.description),
            0
          );
          const totalQty = r.quantity || 1;
          const receivedQty = Math.max(0, totalQty - damagedLostQty);
          return sum + receivedQty;
        }
        return sum + (r.quantity || 1);
      }, 0);

    const damaged = requests
      .filter(
        (r) =>
          r.has_fine && r.fine_reason === "Damaged" && r.fine_status !== "Paid"
      )
      .reduce((sum, r) => {
        if (r.lib_book_fines) {
          const damagedFines = r.lib_book_fines.filter(
            (f) => f.reason === "Damaged" && f.status !== "Paid"
          );
          return (
            sum +
            damagedFines.reduce(
              (fineSum, f) =>
                fineSum + extractQuantityFromDescription(f.description),
              0
            )
          );
        }
        return sum + (r.quantity || 1);
      }, 0);

    const lost = requests
      .filter(
        (r) =>
          r.has_fine && r.fine_reason === "Lost" && r.fine_status !== "Paid"
      )
      .reduce((sum, r) => {
        if (r.lib_book_fines) {
          const lostFines = r.lib_book_fines.filter(
            (f) => f.reason === "Lost" && f.status !== "Paid"
          );
          return (
            sum +
            lostFines.reduce(
              (fineSum, f) =>
                fineSum + extractQuantityFromDescription(f.description),
              0
            )
          );
        }
        return sum + (r.quantity || 1);
      }, 0);

    const settled = requests
      .filter((r) => r.has_fine && r.fine_status === "Paid")
      .reduce((sum, r) => {
        if (r.lib_book_fines) {
          const paidFines = r.lib_book_fines.filter((f) => f.status === "Paid");
          return (
            sum +
            paidFines.reduce(
              (fineSum, f) =>
                fineSum + extractQuantityFromDescription(f.description),
              0
            )
          );
        }
        return sum + (r.quantity || 1);
      }, 0);

    // Total books from approved requests (approved by admin, ready to be borrowed)
    const totalApprovedBooks = requests
      .filter((r) => r.status === "Approved")
      .reduce((sum, r) => sum + (r.quantity || 1), 0);

    return {
      total,
      pending,
      approved,
      borrowed,
      overdue,
      received,
      damaged,
      lost,
      settled,
      totalApprovedBooks,
    };
  }, [requests]);

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-9">
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
              {stats.totalApprovedBooks}
            </div>
            <p className="text-xs text-muted-foreground">Borrowed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {stats.received}
            </div>
            <p className="text-xs text-muted-foreground">Received Books</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {stats.settled}
            </div>
            <p className="text-xs text-muted-foreground">Settled Books</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">
              {stats.damaged}
            </div>
            <p className="text-xs text-muted-foreground">Damaged Books</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{stats.lost}</div>
            <p className="text-xs text-muted-foreground">Lost Books</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">
              {stats.overdue}
            </div>
            <p className="text-xs text-muted-foreground">Overdue Books</p>
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
            <SelectItem value="Received">Received</SelectItem>
            <SelectItem value="Damaged">Damaged</SelectItem>
            <SelectItem value="Lost">Lost</SelectItem>
            <SelectItem value="Settled">Settled</SelectItem>
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
                <TableHead className="font-semibold">Assigned Staff</TableHead>
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
                  <TableCell colSpan={9} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <Package className="h-12 w-12 text-muted-foreground/50" />
                      <p className="text-muted-foreground font-medium">
                        {searchQuery || statusFilter !== "all"
                          ? "No book requests found matching your filters."
                          : "No book requests found."}
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
                      {request.staff ? (
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {request.staff.full_name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {request.staff.email}
                          </span>
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
                      {(() => {
                        const displayStatus = getDisplayStatus(
                          request.status,
                          request.quantity,
                          request.has_fine,
                          request.fine_reason,
                          request.fine_status,
                          request.lib_book_fines
                        );
                        return (
                          <Badge
                            variant={getStatusVariant(
                              request.status,
                              request.has_fine,
                              request.fine_reason,
                              request.fine_status,
                              displayStatus
                            )}
                            className={`font-medium ${
                              displayStatus.startsWith("Received")
                                ? "bg-green-600 hover:bg-green-700 text-white"
                                : displayStatus.startsWith("Settled")
                                ? "bg-blue-600 hover:bg-blue-700 text-white"
                                : ""
                            }`}
                          >
                            {displayStatus}
                          </Badge>
                        );
                      })()}
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
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => {
                              setSelectedRequest(request);
                              setViewDetailsDialogOpen(true);
                            }}
                          >
                            <BookOpen className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          {request.status === "Pending" && (
                            <>
                              <DropdownMenuItem
                                className="cursor-pointer"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setApproveDialogOpen(true);
                                }}
                              >
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive cursor-pointer focus:text-destructive">
                                <XCircle className="mr-2 h-4 w-4" />
                                Reject
                              </DropdownMenuItem>
                            </>
                          )}
                          {request.status === "Borrowed" && (
                            <DropdownMenuItem className="cursor-pointer">
                              <Package className="mr-2 h-4 w-4" />
                              Mark as Returned
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

      {/* Approve Book Request Dialog */}
      <ApproveBookRequestDialog
        open={approveDialogOpen}
        onOpenChange={setApproveDialogOpen}
        request={selectedRequest}
        onSuccess={() => {
          setApproveDialogOpen(false);
          setSelectedRequest(null);
          if (onRefresh) {
            onRefresh();
          } else {
            window.location.reload();
          }
        }}
      />

      {/* View Book Request Details Dialog */}
      <ViewBookRequestDetailsDialog
        open={viewDetailsDialogOpen}
        onOpenChange={setViewDetailsDialogOpen}
        request={selectedRequest}
      />
    </div>
  );
}
