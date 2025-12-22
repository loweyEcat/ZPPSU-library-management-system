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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Eye, MoreHorizontal, Package, X, RotateCcw } from "lucide-react";
import { ViewBookDialogForStudent } from "./view-book-dialog";
import { ViewRequestDetailsDialog } from "./view-request-details-dialog";
import { CancelRequestDialog } from "./cancel-request-dialog";
import { ReturnBookDialog } from "./return-book-dialog";
import { lib_books_status } from "../../../generated/prisma/enums";

interface BookRequest {
  id: number;
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
  created_at: string | null;
  updated_at: string | null;
  staff_receiver: string | null;
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
    status: lib_books_status;
  };
}

interface StudentBookRequestsTableProps {
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
  fineStatus?: "Unpaid" | "Paid" | "Waived" | "Partially_Paid" | null
): "default" | "secondary" | "destructive" | "outline" {
  // If there's a fine and it's paid, show "Settled" with blue color
  if (hasFine && fineStatus === "Paid") {
    return "default"; // Will be styled with blue color via className
  }
  // If there's a fine and it's not paid, show the fine reason status
  if (hasFine && fineReason) {
    return fineReason === "Damaged" ? "secondary" : "destructive";
  }
  // If status is Received, it will be styled with success color via className
  if (status === "Received") return "default";
  if (status === "Approved" || status === "Borrowed") return "default";
  if (status === "Pending" || status === "Under_Review") return "secondary";
  if (status === "Returned") return "outline";
  if (status === "Rejected" || status === "Overdue") return "destructive";
  return "secondary";
}

function getDisplayStatus(
  status: string | null,
  hasFine?: boolean,
  fineReason?: "Damaged" | "Lost" | null,
  fineStatus?: "Unpaid" | "Paid" | "Waived" | "Partially_Paid" | null
): string {
  // If there's a fine and it's paid, show "Settled"
  if (hasFine && fineStatus === "Paid") {
    return "Settled";
  }
  // If there's a fine and it's not paid, show the fine reason
  if (hasFine && fineReason) {
    return fineReason;
  }
  // Otherwise show the request status
  return formatStatus(status);
}

export function StudentBookRequestsTable({
  requests,
  onRefresh,
}: StudentBookRequestsTableProps) {
  const [viewBookDialogOpen, setViewBookDialogOpen] = React.useState(false);
  const [viewRequestDialogOpen, setViewRequestDialogOpen] =
    React.useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = React.useState(false);
  const [returnDialogOpen, setReturnDialogOpen] = React.useState(false);
  const [selectedBookId, setSelectedBookId] = React.useState<number | null>(
    null
  );
  const [selectedRequestId, setSelectedRequestId] = React.useState<
    number | null
  >(null);
  const [selectedRequest, setSelectedRequest] =
    React.useState<BookRequest | null>(null);

  const handleViewBook = (bookId: number) => {
    setSelectedBookId(bookId);
    setViewBookDialogOpen(true);
  };

  const handleViewRequest = (request: BookRequest) => {
    setSelectedRequest(request);
    setViewRequestDialogOpen(true);
  };

  const handleCancelRequest = (requestId: number, request: BookRequest) => {
    setSelectedRequestId(requestId);
    setSelectedRequest(request);
    setCancelDialogOpen(true);
  };

  const handleReturnBook = (requestId: number, request: BookRequest) => {
    setSelectedRequestId(requestId);
    setSelectedRequest(request);
    setReturnDialogOpen(true);
  };

  const handleCancelSuccess = () => {
    setCancelDialogOpen(false);
    setSelectedRequestId(null);
    setSelectedRequest(null);
    // Refresh the page to update the tabs
    window.location.reload();
  };

  const handleReturnSuccess = () => {
    setReturnDialogOpen(false);
    setSelectedRequestId(null);
    setSelectedRequest(null);
    // Refresh the page to update the tabs
    window.location.reload();
  };

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 border rounded-lg">
        <Package className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground font-medium">
          No book requests found.
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Request books from the Books tab to see them here.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Book Name</TableHead>
              <TableHead>Copies Requested</TableHead>
              <TableHead>Requested Date</TableHead>
              <TableHead>Tracking #</TableHead>
              <TableHead>Staff Receiver</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Date Returned</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((request) => (
              <TableRow key={request.id}>
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span>{request.book.books_name}</span>
                    <span className="text-xs text-muted-foreground">
                      by {request.book.author_name}
                    </span>
                  </div>
                </TableCell>
                <TableCell>{request.quantity ?? 1}</TableCell>
                <TableCell>
                  {request.request_date
                    ? new Date(request.request_date).toLocaleDateString()
                    : "N/A"}
                </TableCell>
                <TableCell>
                  {request.status === "Pending" || !request.tracking_number ? (
                    <span className="text-muted-foreground italic">N/A</span>
                  ) : (
                    <span className="font-mono text-sm">
                      {request.tracking_number}
                    </span>
                  )}
                </TableCell>

                <TableCell>
                  {request.staff_receiver ? (
                    <span>{request.staff_receiver}</span>
                  ) : (
                    <span className="text-muted-foreground italic">N/A</span>
                  )}
                </TableCell>

                <TableCell>
                  {request.due_date ? (
                    new Date(request.due_date).toLocaleDateString()
                  ) : (
                    <span className="text-muted-foreground italic">N/A</span>
                  )}
                </TableCell>
                <TableCell>
                  {request.return_date
                    ? new Date(request.return_date).toLocaleDateString()
                    : "N/A"}
                </TableCell>
                <TableCell>
                  {(() => {
                    const displayStatus = getDisplayStatus(
                      request.status,
                      request.has_fine,
                      request.fine_reason,
                      request.fine_status
                    );
                    return (
                      <Badge
                        variant={getStatusVariant(
                          request.status,
                          request.has_fine,
                          request.fine_reason,
                          request.fine_status
                        )}
                        className={
                          displayStatus === "Received"
                            ? "bg-green-600 hover:bg-green-700 text-white"
                            : displayStatus === "Settled"
                            ? "bg-blue-600 hover:bg-blue-700 text-white"
                            : ""
                        }
                      >
                        {displayStatus}
                      </Badge>
                    );
                  })()}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleViewBook(request.book.id)}
                        className="cursor-pointer"
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Book Details
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleViewRequest(request)}
                        className="cursor-pointer"
                      >
                        <Package className="mr-2 h-4 w-4" />
                        View Request Details
                      </DropdownMenuItem>
                      {request.status === "Pending" && (
                        <DropdownMenuItem
                          onClick={() =>
                            handleCancelRequest(request.id, request)
                          }
                          className="cursor-pointer text-destructive focus:text-destructive"
                        >
                          <X className="mr-2 h-4 w-4" />
                          Cancel Request
                        </DropdownMenuItem>
                      )}
                      {(request.status === "Approved" ||
                        request.status === "Borrowed") && (
                        <DropdownMenuItem
                          onClick={() => handleReturnBook(request.id, request)}
                          className="cursor-pointer"
                        >
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Return Books
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* View Book Dialog */}
      <ViewBookDialogForStudent
        open={viewBookDialogOpen}
        onOpenChange={setViewBookDialogOpen}
        bookId={selectedBookId}
      />

      {/* View Request Details Dialog */}
      {selectedRequest && (
        <ViewRequestDetailsDialog
          open={viewRequestDialogOpen}
          onOpenChange={setViewRequestDialogOpen}
          request={selectedRequest}
        />
      )}

      {/* Cancel Request Dialog */}
      {selectedRequest && (
        <CancelRequestDialog
          open={cancelDialogOpen}
          onOpenChange={setCancelDialogOpen}
          requestId={selectedRequestId}
          request={selectedRequest}
          onSuccess={handleCancelSuccess}
        />
      )}

      {/* Return Book Dialog */}
      {selectedRequest && (
        <ReturnBookDialog
          open={returnDialogOpen}
          onOpenChange={setReturnDialogOpen}
          requestId={selectedRequestId}
          request={selectedRequest}
          onSuccess={handleReturnSuccess}
        />
      )}
    </>
  );
}
