"use client";

import * as React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { returnBook } from "@/app/dashboard/student/books/actions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

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

interface ReturnBookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestId: number | null;
  request: BookRequest;
  onSuccess?: () => void;
}

export function ReturnBookDialog({
  open,
  onOpenChange,
  requestId,
  request,
  onSuccess,
}: ReturnBookDialogProps) {
  const [isReturning, setIsReturning] = React.useState(false);

  const handleReturn = async () => {
    if (!requestId) return;

    setIsReturning(true);
    try {
      const result = await returnBook(requestId);
      if (result.success) {
        toast.success(result.message || "Book returned successfully!");
        onOpenChange(false);
        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast.error(result.message || "Failed to return book.");
      }
    } catch (error) {
      console.error("Error returning book:", error);
      toast.error("An error occurred while returning the book.");
    } finally {
      setIsReturning(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Return Books</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to return <strong>{request.book.books_name}</strong>?
            {request.status === "Approved" 
              ? " This will cancel the approval and make the book available again."
              : " This will mark the book as returned and update the available copies."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isReturning}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleReturn}
            disabled={isReturning}
          >
            {isReturning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Returning...
              </>
            ) : (
              "Return Books"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

