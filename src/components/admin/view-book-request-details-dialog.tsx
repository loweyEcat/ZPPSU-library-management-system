"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Package,
  Hash,
  Calendar,
  User,
  BookOpen,
  X,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
} from "lucide-react";

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

interface ViewBookRequestDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: BookRequest | null;
}

function formatStatus(status: string | null): string {
  if (!status) return "Unknown";
  return status.replace(/_/g, " ");
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleString();
  } catch {
    return "N/A";
  }
}

// Extract quantity from fine description (format: "Description (Quantity: X)")
function extractQuantityFromDescription(description: string | null): number {
  if (!description) return 1;
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
  
  if (hasFine && fineStatus === "Paid" && fines) {
    const settledQty = fines
      .filter((f) => f.status === "Paid")
      .reduce((sum, f) => sum + extractQuantityFromDescription(f.description), 0);
    return settledQty > 0 ? `Settled(${settledQty})` : "Settled";
  }
  
  if (hasFine && fineReason) {
    return fineReason;
  }
  
  if (status === "Received" && fines) {
    const damagedLostQty = fines.reduce((sum, f) => {
      return sum + extractQuantityFromDescription(f.description);
    }, 0);
    const receivedQty = Math.max(0, totalQty - damagedLostQty);
    return receivedQty > 0 ? `Received(${receivedQty})` : "Received";
  }
  
  return formatStatus(status);
}

function getStatusVariant(
  status: string | null,
  hasFine?: boolean,
  fineReason?: "Damaged" | "Lost" | null,
  fineStatus?: "Unpaid" | "Paid" | "Waived" | "Partially_Paid" | null,
  displayStatus?: string
): "default" | "secondary" | "destructive" {
  if (displayStatus) {
    if (displayStatus.startsWith("Settled")) {
      return "default";
    }
    if (displayStatus.startsWith("Received")) {
      return "default";
    }
    if (displayStatus === "Damaged") {
      return "secondary";
    }
    if (displayStatus === "Lost") {
      return "destructive";
    }
  }
  
  if (hasFine && fineStatus === "Paid") {
    return "default";
  }
  if (hasFine && fineReason) {
    return fineReason === "Damaged" ? "secondary" : "destructive";
  }
  if (status === "Received") return "default";
  if (status === "Approved" || status === "Returned") return "default";
  if (status === "Pending" || status === "Borrowed") return "secondary";
  if (status === "Overdue" || status === "Rejected") return "destructive";
  return "secondary";
}

export function ViewBookRequestDetailsDialog({
  open,
  onOpenChange,
  request,
}: ViewBookRequestDetailsDialogProps) {
  if (!request) return null;

  const totalQty = request.quantity || 1;
  const fines = request.lib_book_fines || [];
  
  // Calculate damaged/lost quantities
  const damagedFines = fines.filter((f) => f.reason === "Damaged");
  const lostFines = fines.filter((f) => f.reason === "Lost");
  const damagedQty = damagedFines.reduce(
    (sum, f) => sum + extractQuantityFromDescription(f.description),
    0
  );
  const lostQty = lostFines.reduce(
    (sum, f) => sum + extractQuantityFromDescription(f.description),
    0
  );
  const totalDamagedLostQty = damagedQty + lostQty;
  const receivedQty = Math.max(0, totalQty - totalDamagedLostQty);

  const displayStatus = getDisplayStatus(
    request.status,
    request.quantity,
    request.has_fine,
    request.fine_reason,
    request.fine_status,
    request.lib_book_fines
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader className="space-y-3 pb-4 border-b">
          <DialogTitle className="text-2xl font-semibold flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" />
            Book Request Details
          </DialogTitle>
          <DialogDescription className="text-base">
            Complete information about the book request including verification status.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Header Section with Status */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border border-primary/20">
            <div className="flex-1">
              <h2 className="text-xl font-bold mb-1">{request.book.books_name}</h2>
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" />
                <span className="text-sm">{request.book.author_name}</span>
              </div>
            </div>
            <Badge
              variant={getStatusVariant(
                request.status,
                request.has_fine,
                request.fine_reason,
                request.fine_status,
                displayStatus
              )}
              className={`font-medium text-sm px-3 py-1.5 ${
                displayStatus.startsWith("Received")
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : displayStatus.startsWith("Settled")
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : ""
              }`}
            >
              {displayStatus}
            </Badge>
          </div>

          {/* Request Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Request Information</h3>
            </div>
            <Separator />
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  Tracking Number
                </label>
                <p className="text-sm font-mono bg-muted p-2 rounded-md">
                  {request.tracking_number}
                </p>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Quantity Borrowed
                </label>
                <p className="text-sm bg-muted p-2 rounded-md font-medium">
                  {totalQty} {totalQty === 1 ? "book" : "books"}
                </p>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Requested Date
                </label>
                <p className="text-sm bg-muted p-2 rounded-md">
                  {formatDate(request.request_date)}
                </p>
              </div>
              {request.approved_date && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Approved Date
                  </label>
                  <p className="text-sm bg-muted p-2 rounded-md">
                    {formatDate(request.approved_date)}
                  </p>
                </div>
              )}
              {request.borrow_date && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Borrow Date
                  </label>
                  <p className="text-sm bg-muted p-2 rounded-md">
                    {formatDate(request.borrow_date)}
                  </p>
                </div>
              )}
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Due Date
                </label>
                <p className="text-sm bg-muted p-2 rounded-md">
                  {formatDate(request.due_date)}
                </p>
              </div>
              {request.return_date && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Return Date
                  </label>
                  <p className="text-sm bg-muted p-2 rounded-md">
                    {formatDate(request.return_date)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Book Return Verification Details */}
          {(request.status === "Received" || request.has_fine || totalDamagedLostQty > 0 || receivedQty > 0) && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Book Return Verification</h3>
              </div>
              <Separator />
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-1 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
                  <label className="text-sm font-medium text-green-700 dark:text-green-400 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Received Books
                  </label>
                  <p className="text-lg font-bold text-green-700 dark:text-green-400">
                    {receivedQty > 0 ? `${receivedQty} ${receivedQty === 1 ? "book" : "books"}` : "None"}
                  </p>
                  {receivedQty > 0 && (
                    <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                      Successfully returned and verified
                    </p>
                  )}
                </div>
                {damagedQty > 0 && (
                  <div className="space-y-1 p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-900">
                    <label className="text-sm font-medium text-orange-700 dark:text-orange-400 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Damaged Books
                    </label>
                    <p className="text-lg font-bold text-orange-700 dark:text-orange-400">
                      {damagedQty} {damagedQty === 1 ? "book" : "books"}
                    </p>
                    <p className="text-xs text-orange-600 dark:text-orange-500 mt-1">
                      {damagedFines.some((f) => f.status === "Paid")
                        ? "Fine paid"
                        : "Fine pending"}
                    </p>
                  </div>
                )}
                {lostQty > 0 && (
                  <div className="space-y-1 p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900">
                    <label className="text-sm font-medium text-red-700 dark:text-red-400 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Lost Books
                    </label>
                    <p className="text-lg font-bold text-red-700 dark:text-red-400">
                      {lostQty} {lostQty === 1 ? "book" : "books"}
                    </p>
                    <p className="text-xs text-red-600 dark:text-red-500 mt-1">
                      {lostFines.some((f) => f.status === "Paid")
                        ? "Fine paid"
                        : "Fine pending"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Fine Details */}
          {fines.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Fine Details</h3>
              </div>
              <Separator />
              <div className="space-y-3">
                {fines.map((fine) => {
                  const qty = extractQuantityFromDescription(fine.description);
                  return (
                    <div
                      key={fine.id}
                      className="p-4 bg-muted rounded-lg border"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              fine.reason === "Damaged" ? "secondary" : "destructive"
                            }
                            className="font-medium"
                          >
                            {fine.reason}
                          </Badge>
                          <Badge
                            variant={
                              fine.status === "Paid"
                                ? "default"
                                : fine.status === "Partially_Paid"
                                ? "secondary"
                                : "outline"
                            }
                            className={`font-medium ${
                              fine.status === "Paid"
                                ? "bg-blue-600 hover:bg-blue-700 text-white"
                                : ""
                            }`}
                          >
                            {fine.status === "Paid"
                              ? "Paid"
                              : fine.status === "Partially_Paid"
                              ? "Partially Paid"
                              : "Unpaid"}
                          </Badge>
                        </div>
                        <span className="text-sm font-medium">
                          Quantity: {qty}
                        </span>
                      </div>
                      {fine.description && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {fine.description}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Student Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Student Information</h3>
            </div>
            <Separator />
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">
                  Full Name
                </label>
                <p className="text-sm bg-muted p-2 rounded-md">
                  {request.student.full_name}
                </p>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">
                  Email
                </label>
                <p className="text-sm bg-muted p-2 rounded-md">
                  {request.student.email}
                </p>
              </div>
              {request.student.student_id && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">
                    Student ID
                  </label>
                  <p className="text-sm bg-muted p-2 rounded-md">
                    {request.student.student_id}
                  </p>
                </div>
              )}
              {request.student.year_level && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">
                    Year Level
                  </label>
                  <p className="text-sm bg-muted p-2 rounded-md">
                    {request.student.year_level}
                  </p>
                </div>
              )}
              {request.student.department && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">
                    Department
                  </label>
                  <p className="text-sm bg-muted p-2 rounded-md">
                    {request.student.department}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Staff Information */}
          {request.staff && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Assigned Staff</h3>
              </div>
              <Separator />
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">
                    Full Name
                  </label>
                  <p className="text-sm bg-muted p-2 rounded-md">
                    {request.staff.full_name}
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">
                    Email
                  </label>
                  <p className="text-sm bg-muted p-2 rounded-md">
                    {request.staff.email}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Book Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Book Information</h3>
            </div>
            <Separator />
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">
                  Book Name
                </label>
                <p className="text-sm bg-muted p-2 rounded-md">
                  {request.book.books_name}
                </p>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">
                  Author
                </label>
                <p className="text-sm bg-muted p-2 rounded-md">
                  {request.book.author_name}
                </p>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">
                  ISBN
                </label>
                <p className="text-sm font-mono bg-muted p-2 rounded-md">
                  {request.book.isbn}
                </p>
              </div>
            </div>
          </div>

          {/* Close Button */}
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={() => onOpenChange(false)} variant="outline">
              <X className="mr-2 h-4 w-4" />
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

