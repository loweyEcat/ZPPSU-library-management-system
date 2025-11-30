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
  Search,
  AlertTriangle,
  XCircle,
  DollarSign,
  MoreHorizontal,
  CheckCircle2,
  Eye,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { markFineAsPaid } from "@/app/dashboard/staff/books-requested/actions";
import { useRouter } from "next/navigation";
import { ViewFineDetailsDialog } from "@/components/staff/view-fine-details-dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Card, CardContent } from "@/components/ui/card";

interface BookFine {
  id: number;
  student_id: number;
  book_id: number;
  request_id: number;
  fine_amount: number | string;
  reason: "Damaged" | "Lost";
  status: "Unpaid" | "Paid" | "Waived" | "Partially_Paid" | "Partially Paid";
  description: string | null;
  due_date: string;
  paid_date: string | null;
  created_at: string;
  student: {
    id: number;
    full_name: string;
    email: string;
    student_id: string | null;
    year_level: string | null;
    department: string | null;
  };
  lib_book_requests: {
    id: number;
    tracking_number: string;
    return_date: string | null;
    status: string | null;
    quantity: number | null;
    book: {
      id: number;
      books_name: string;
      author_name: string;
      isbn: string;
    };
  };
}

interface BooksWithFinesTableProps {
  fines: BookFine[];
  onRefresh?: () => void;
}

function formatStatus(status: string): string {
  if (!status) return "Unknown";
  // Handle enum values like "Partially_Paid" -> "Partially Paid"
  return status.replace(/_/g, " ");
}

function getStatusVariant(
  status: string
): "default" | "secondary" | "destructive" {
  if (status === "Paid") return "default";
  if (status === "Partially_Paid" || status === "Partially Paid")
    return "secondary";
  if (status === "Unpaid") return "destructive";
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

function formatCurrency(amount: number | string): string {
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(numAmount);
}

// Extract quantity from fine description (format: "Description (Quantity: X)")
function extractQuantityFromDescription(description: string | null): number {
  if (!description) return 1; // Default to 1 if no description
  const match = description.match(/Quantity:\s*(\d+)/i);
  return match ? parseInt(match[1]) : 1;
}

// Calculate received quantity from total quantity and all fines for the request
function calculateReceivedQuantity(
  totalQuantity: number | null,
  allFines: BookFine[]
): number {
  const totalQty = totalQuantity || 1;
  const damagedLostQty = allFines.reduce((sum, fine) => {
    return sum + extractQuantityFromDescription(fine.description);
  }, 0);
  return Math.max(0, totalQty - damagedLostQty);
}

const ITEMS_PER_PAGE = 15;

export function BooksWithFinesTable({
  fines,
  onRefresh,
}: BooksWithFinesTableProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [processingFineId, setProcessingFineId] = React.useState<number | null>(
    null
  );
  const [selectedFine, setSelectedFine] = React.useState<BookFine | null>(null);
  const [viewDetailsOpen, setViewDetailsOpen] = React.useState(false);

  const handleMarkAsPaid = async (fineId: number) => {
    setProcessingFineId(fineId);
    try {
      const result = await markFineAsPaid(fineId);
      if (result.success) {
        toast.success(result.message || "Fine marked as paid successfully!");
        router.refresh();
      } else {
        toast.error(result.message || "Failed to mark fine as paid.");
      }
    } catch (error) {
      console.error("Error marking fine as paid:", error);
      toast.error("An error occurred while marking the fine as paid.");
    } finally {
      setProcessingFineId(null);
    }
  };

  // Group fines by request_id to calculate quantities
  const finesByRequest = React.useMemo(() => {
    const grouped = new Map<number, BookFine[]>();
    fines.forEach((fine) => {
      const requestId = fine.request_id;
      if (!grouped.has(requestId)) {
        grouped.set(requestId, []);
      }
      grouped.get(requestId)!.push(fine);
    });
    return grouped;
  }, [fines]);

  // Filter fines based on search query
  const filteredFines = React.useMemo(() => {
    let filtered = fines;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((fine) => {
        return (
          fine.lib_book_requests.tracking_number
            .toLowerCase()
            .includes(query) ||
          fine.lib_book_requests.book.books_name
            .toLowerCase()
            .includes(query) ||
          fine.lib_book_requests.book.author_name
            .toLowerCase()
            .includes(query) ||
          fine.student.full_name.toLowerCase().includes(query) ||
          fine.student.email.toLowerCase().includes(query) ||
          (fine.student.student_id &&
            fine.student.student_id.toLowerCase().includes(query))
        );
      });
    }

    return filtered;
  }, [fines, searchQuery]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredFines.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedFines = filteredFines.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Calculate statistics
  const stats = React.useMemo(() => {
    const total = fines.length;
    const unpaid = fines.filter((f) => f.status === "Unpaid").length;
    const paid = fines.filter((f) => f.status === "Paid").length;
    const totalAmount = fines.reduce((sum, fine) => {
      const amount =
        typeof fine.fine_amount === "string"
          ? parseFloat(fine.fine_amount)
          : fine.fine_amount;
      return sum + amount;
    }, 0);

    return {
      total,
      unpaid,
      paid,
      totalAmount,
    };
  }, [fines]);

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total Fines</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">
              {stats.unpaid}
            </div>
            <p className="text-xs text-muted-foreground">Unpaid</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {stats.paid}
            </div>
            <p className="text-xs text-muted-foreground">Paid</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(stats.totalAmount)}
            </div>
            <p className="text-xs text-muted-foreground">Total Amount</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by tracking number, book title, author, student name, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-11 bg-background border-2 focus:border-primary transition-colors"
          />
        </div>
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
                <TableHead className="font-semibold">Reason</TableHead>
                <TableHead className="font-semibold">Damage/Lost</TableHead>
                <TableHead className="font-semibold">Received</TableHead>
                <TableHead className="font-semibold">Fine Amount</TableHead>
                <TableHead className="font-semibold">Due Date</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Remarks</TableHead>
                <TableHead className="text-right font-semibold">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedFines.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <DollarSign className="h-12 w-12 text-muted-foreground/50" />
                      <p className="text-muted-foreground font-medium">
                        {searchQuery
                          ? "No fines found matching your search."
                          : "No fines found."}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedFines.map((fine) => (
                  <TableRow
                    key={fine.id}
                    className="transition-colors hover:bg-muted/50"
                  >
                    <TableCell className="font-mono text-sm font-medium">
                      {fine.lib_book_requests.tracking_number}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {fine.lib_book_requests.book.books_name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {fine.lib_book_requests.book.author_name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {fine.student.full_name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {fine.student.email}
                        </span>
                        {fine.student.student_id && (
                          <span className="text-xs text-muted-foreground">
                            ID: {fine.student.student_id}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          fine.reason === "Damaged"
                            ? "secondary"
                            : "destructive"
                        }
                        className="font-medium"
                      >
                        {fine.reason === "Damaged" ? (
                          <AlertTriangle className="mr-1 h-3 w-3" />
                        ) : (
                          <XCircle className="mr-1 h-3 w-3" />
                        )}
                        {fine.reason}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-center">
                      {(() => {
                        // Get all fines for this request to calculate total damaged/lost
                        const requestFines =
                          finesByRequest.get(fine.request_id) || [];
                        const totalDamagedLost = requestFines.reduce(
                          (sum, f) => {
                            return (
                              sum +
                              extractQuantityFromDescription(f.description)
                            );
                          },
                          0
                        );
                        return totalDamagedLost;
                      })()}
                    </TableCell>
                    <TableCell className="font-medium text-center text-green-600">
                      {(() => {
                        const requestFines =
                          finesByRequest.get(fine.request_id) || [];
                        const receivedQty = calculateReceivedQuantity(
                          fine.lib_book_requests.quantity,
                          requestFines
                        );
                        return receivedQty > 0 ? receivedQty : "-";
                      })()}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(fine.fine_amount)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{formatDate(fine.due_date)}</div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getStatusVariant(fine.status)}
                        className="font-medium"
                      >
                        {formatStatus(fine.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground max-w-xs truncate">
                        {fine.description || "N/A"}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            disabled={processingFineId === fine.id}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          {(fine.status === "Unpaid" ||
                            fine.status === "Partially_Paid" ||
                            fine.status === "Partially Paid") && (
                            <DropdownMenuItem
                              className="cursor-pointer"
                              onClick={() => handleMarkAsPaid(fine.id)}
                              disabled={processingFineId === fine.id}
                            >
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              {processingFineId === fine.id
                                ? "Processing..."
                                : "Mark as Paid"}
                            </DropdownMenuItem>
                          )}
                          {fine.status === "Paid" && (
                            <DropdownMenuItem
                              className="cursor-pointer"
                              onClick={() => {
                                setSelectedFine(fine);
                                setViewDetailsOpen(true);
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
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
              {Math.min(endIndex, filteredFines.length)}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-foreground">
              {filteredFines.length}
            </span>{" "}
            fines
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

      {/* View Details Dialog */}
      <ViewFineDetailsDialog
        open={viewDetailsOpen}
        onOpenChange={setViewDetailsOpen}
        fine={selectedFine}
      />
    </div>
  );
}
