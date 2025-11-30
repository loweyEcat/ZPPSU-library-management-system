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
} from "lucide-react";

interface BookRequest {
  id: number;
  tracking_number: string;
  quantity: number | null;
  request_date: string | null;
  approved_date: string | null;
  borrow_date: string | null;
  due_date: string | null;
  return_date: string | null;
  status: "Pending" | "Approved" | "Borrowed" | "Returned" | "Under_Review" | "Received" | "Overdue" | "Rejected" | null;
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
    status: "Available" | "Not_Available" | "Lost" | "Damaged";
  };
}

interface ViewRequestDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: BookRequest;
}

function formatStatus(status: string | null): string {
  if (!status) return "Unknown";
  return status.replace(/_/g, " ");
}

function getStatusVariant(
  status: string | null
): "default" | "secondary" | "destructive" | "outline" {
  if (status === "Approved" || status === "Borrowed") return "default";
  if (status === "Pending") return "secondary";
  if (status === "Returned" || status === "Under_Review") return "outline";
  if (status === "Rejected" || status === "Overdue") return "destructive";
  return "secondary";
}

export function ViewRequestDetailsDialog({
  open,
  onOpenChange,
  request,
}: ViewRequestDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto">
        <DialogHeader className="space-y-3 pb-4 border-b">
          <DialogTitle className="text-2xl font-semibold flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" />
            Request Details
          </DialogTitle>
          <DialogDescription className="text-base">
            Complete information about your book request.
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
              variant={getStatusVariant(request.status)}
              className="font-medium text-sm px-3 py-1.5"
            >
              {formatStatus(request.status)}
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
                <p className={`text-sm bg-muted p-2 rounded-md ${
                  request.status === "Pending" || !request.tracking_number
                    ? "text-muted-foreground italic"
                    : "font-mono"
                }`}>
                  {request.status === "Pending" || !request.tracking_number
                    ? "N/A"
                    : request.tracking_number}
                </p>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Quantity
                </label>
                <p className="text-sm bg-muted p-2 rounded-md">
                  {request.quantity ?? 1}
                </p>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Requested Date
                </label>
                <p className="text-sm bg-muted p-2 rounded-md">
                  {request.request_date
                    ? new Date(request.request_date).toLocaleString()
                    : "N/A"}
                </p>
              </div>
              {request.approved_date && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Approved Date
                  </label>
                  <p className="text-sm bg-muted p-2 rounded-md">
                    {new Date(request.approved_date).toLocaleString()}
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
                    {new Date(request.borrow_date).toLocaleString()}
                  </p>
                </div>
              )}
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Due Date
                </label>
                <p className="text-sm bg-muted p-2 rounded-md">
                  {request.due_date
                    ? new Date(request.due_date).toLocaleString()
                    : "N/A"}
                </p>
              </div>
              {request.return_date && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Return Date
                  </label>
                  <p className="text-sm bg-muted p-2 rounded-md">
                    {new Date(request.return_date).toLocaleString()}
                  </p>
                </div>
              )}
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Staff Receiver
                </label>
                <p className="text-sm bg-muted p-2 rounded-md">
                  {request.staff_receiver || "N/A"}
                </p>
              </div>
            </div>
          </div>

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
                  ISBN
                </label>
                <p className="text-sm font-mono bg-muted p-2 rounded-md">
                  {request.book.isbn}
                </p>
              </div>
              {request.book.publication_year && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">
                    Publication Year
                  </label>
                  <p className="text-sm bg-muted p-2 rounded-md">
                    {request.book.publication_year}
                  </p>
                </div>
              )}
              {request.book.publisher && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">
                    Publisher
                  </label>
                  <p className="text-sm bg-muted p-2 rounded-md">
                    {request.book.publisher}
                  </p>
                </div>
              )}
              {request.book.department && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">
                    Department
                  </label>
                  <Badge variant="outline" className="text-sm p-2 h-auto">
                    {request.book.department}
                  </Badge>
                </div>
              )}
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

