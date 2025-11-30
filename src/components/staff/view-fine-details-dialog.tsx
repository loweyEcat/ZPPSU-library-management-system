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
import { Separator } from "@/components/ui/separator";
import {
  DollarSign,
  User,
  BookOpen,
  Calendar,
  FileText,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Hash,
  Building,
  Mail,
} from "lucide-react";

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
    book: {
      id: number;
      books_name: string;
      author_name: string;
      isbn: string;
    };
  };
}

interface ViewFineDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fine: BookFine | null;
}

function formatStatus(status: string): string {
  if (!status) return "Unknown";
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
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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

export function ViewFineDetailsDialog({
  open,
  onOpenChange,
  fine,
}: ViewFineDetailsDialogProps) {
  if (!fine) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto">
        <DialogHeader className="space-y-3 pb-4 border-b">
          <DialogTitle className="text-2xl font-semibold flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-primary" />
            Fine Payment Details
          </DialogTitle>
          <DialogDescription className="text-base">
            Complete information about this fine and payment.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Header Section with Status */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border border-primary/20">
            <div className="flex-1">
              <h2 className="text-xl font-bold mb-1">
                {fine.lib_book_requests.book.books_name}
              </h2>
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" />
                <span className="text-sm">{fine.lib_book_requests.book.author_name}</span>
              </div>
            </div>
            <Badge
              variant={getStatusVariant(fine.status)}
              className="font-medium text-sm px-3 py-1.5"
            >
              <CheckCircle2 className="mr-1 h-3 w-3" />
              {formatStatus(fine.status)}
            </Badge>
          </div>

          {/* Fine Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Fine Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">
                  Fine Amount
                </Label>
                <div className="flex items-center gap-2 text-lg font-bold text-primary">
                  <DollarSign className="h-5 w-5" />
                  {formatCurrency(fine.fine_amount)}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">
                  Reason
                </Label>
                <div>
                  <Badge
                    variant={
                      fine.reason === "Damaged" ? "secondary" : "destructive"
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
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">
                  Due Date
                </Label>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {formatDate(fine.due_date)}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">
                  Paid Date
                </Label>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  {formatDate(fine.paid_date)}
                </div>
              </div>
            </div>
            {fine.description && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">
                  Description
                </Label>
                <div className="p-3 bg-muted/50 rounded-lg border">
                  <p className="text-sm whitespace-pre-wrap">
                    {fine.description}
                  </p>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Student Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Student Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">
                  Full Name
                </Label>
                <div className="flex items-center gap-2 text-sm font-medium">
                  <User className="h-4 w-4 text-muted-foreground" />
                  {fine.student.full_name}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">
                  Email
                </Label>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {fine.student.email}
                </div>
              </div>
              {fine.student.student_id && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Student ID
                  </Label>
                  <div className="flex items-center gap-2 text-sm font-mono">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    {fine.student.student_id}
                  </div>
                </div>
              )}
              {fine.student.department && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Department
                  </Label>
                  <div className="flex items-center gap-2 text-sm">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    {fine.student.department}
                  </div>
                </div>
              )}
              {fine.student.year_level && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Year Level
                  </Label>
                  <div className="text-sm">{fine.student.year_level}</div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Book Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Book Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">
                  Book Title
                </Label>
                <div className="text-sm font-medium">
                  {fine.lib_book_requests.book.books_name}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">
                  Author
                </Label>
                <div className="text-sm">{fine.lib_book_requests.book.author_name}</div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">
                  ISBN
                </Label>
                <div className="text-sm font-mono">
                  {fine.lib_book_requests.book.isbn}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Request Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Request Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">
                  Tracking Number
                </Label>
                <div className="text-sm font-mono font-medium">
                  {fine.lib_book_requests.tracking_number}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">
                  Return Date
                </Label>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {formatDate(fine.lib_book_requests.return_date)}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">
                  Fine Created At
                </Label>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {formatDate(fine.created_at)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Helper component for Label
function Label({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <label className={className}>{children}</label>;
}

