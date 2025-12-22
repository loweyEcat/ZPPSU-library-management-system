"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Users,
  Calendar,
  Package,
  User,
  Mail,
  Hash,
} from "lucide-react";
import { getBookBorrowers } from "@/app/admin/books/actions";
import { format } from "date-fns";

interface Borrower {
  id: number;
  tracking_number: string;
  quantity: number | null;
  request_date: string | null;
  approved_date: string | null;
  borrow_date: string | null;
  due_date: string | null;
  return_date: string | null;
  status: "Approved" | "Borrowed" | "Returned" | null;
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
}

interface Book {
  id: number;
  books_name: string;
  author_name: string;
  isbn: string;
}

interface ViewBookBorrowersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookId: number | null;
}

function formatStatus(status: string | null): string {
  if (!status) return "Unknown";
  return status;
}

function getStatusVariant(
  status: string | null
): "default" | "secondary" | "destructive" {
  if (status === "Returned") return "default";
  if (status === "Approved" || status === "Borrowed") return "secondary";
  return "secondary";
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    return format(date, "MMM dd, yyyy");
  } catch {
    return "N/A";
  }
}

export function ViewBookBorrowersDialog({
  open,
  onOpenChange,
  bookId,
}: ViewBookBorrowersDialogProps) {
  const [loading, setLoading] = React.useState(false);
  const [book, setBook] = React.useState<Book | null>(null);
  const [borrowers, setBorrowers] = React.useState<Borrower[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open && bookId) {
      setLoading(true);
      setError(null);
      getBookBorrowers(bookId)
        .then((result) => {
          if (result.success) {
            setBook(result.book as Book);
            setBorrowers(result.borrowers as Borrower[]);
          } else {
            setError(result.message || "Failed to load borrowers.");
          }
        })
        .catch((err) => {
          console.error("Error loading borrowers:", err);
          setError("An error occurred while loading borrowers.");
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setBook(null);
      setBorrowers([]);
      setError(null);
    }
  }, [open, bookId]);

  if (!bookId) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Book Borrowers
          </DialogTitle>
          <DialogDescription>
            View all students who have borrowed this book.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="py-12 text-center">
            <p className="text-destructive">{error}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Book Information */}
            {book && (
              <div className="p-4 bg-muted/50 rounded-lg border">
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">{book.books_name}</h3>
                  <p className="text-sm text-muted-foreground">
                    By {book.author_name}
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono">{book.isbn}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Borrowers List */}
            {borrowers.length === 0 ? (
              <div className="py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground font-medium">
                  No borrowers found for this book.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">
                    Total Borrowers: {borrowers.length}
                  </h3>
                  <Badge variant="secondary">
                    {borrowers.filter((b) => b.status === "Borrowed").length}{" "}
                    Currently Borrowed
                  </Badge>
                </div>

                <div className="space-y-3">
                  {borrowers.map((borrower) => (
                    <div
                      key={borrower.id}
                      className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        {/* Student Information */}
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                              <User className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold">
                                  {borrower.student.full_name}
                                </h4>
                                <Badge
                                  variant={getStatusVariant(borrower.status)}
                                  className="text-xs"
                                >
                                  {formatStatus(borrower.status)}
                                </Badge>
                              </div>
                              <div className="space-y-1 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                  <Mail className="h-3.5 w-3.5" />
                                  <span>{borrower.student.email}</span>
                                </div>
                                {borrower.student.student_id && (
                                  <div className="flex items-center gap-2">
                                    <Hash className="h-3.5 w-3.5" />
                                    <span>
                                      ID: {borrower.student.student_id}
                                    </span>
                                  </div>
                                )}
                                {borrower.student.department && (
                                  <div>
                                    <span className="font-medium">
                                      Department:{" "}
                                    </span>
                                    {borrower.student.department}
                                  </div>
                                )}
                                {borrower.student.year_level && (
                                  <div>
                                    <span className="font-medium">
                                      Year Level:{" "}
                                    </span>
                                    {borrower.student.year_level}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Request Details */}
                        <div className="sm:w-64 space-y-2 text-sm">
                          <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">
                                Tracking #:
                              </span>
                              <span className="font-mono text-xs">
                                {borrower.tracking_number}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">
                                Quantity:
                              </span>
                              <span className="font-semibold">
                                {borrower.quantity ?? 1}
                              </span>
                            </div>
                            {borrower.staff && (
                              <div className="pt-2 border-t">
                                <div className="text-muted-foreground text-xs">
                                  Assigned Staff:
                                </div>
                                <div className="font-medium text-xs">
                                  {borrower.staff.full_name}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="space-y-1.5 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Requested:
                              </span>
                              <span>{formatDate(borrower.request_date)}</span>
                            </div>
                            {borrower.approved_date && (
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  Approved:
                                </span>
                                <span>
                                  {formatDate(borrower.approved_date)}
                                </span>
                              </div>
                            )}
                            {borrower.due_date && (
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  Due Date:
                                </span>
                                <span className="font-medium">
                                  {formatDate(borrower.due_date)}
                                </span>
                              </div>
                            )}
                            {borrower.return_date && (
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  Returned:
                                </span>
                                <span className="text-green-600 font-medium">
                                  {formatDate(borrower.return_date)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
