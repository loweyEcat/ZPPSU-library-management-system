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
import { cancelBookRequest } from "@/app/dashboard/student/books/actions";
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

interface CancelRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestId: number | null;
  request: BookRequest;
  onSuccess?: () => void;
}

export function CancelRequestDialog({
  open,
  onOpenChange,
  requestId,
  request,
  onSuccess,
}: CancelRequestDialogProps) {
  const [isCanceling, setIsCanceling] = React.useState(false);

  const handleCancel = async () => {
    if (!requestId) return;

    setIsCanceling(true);
    try {
      const result = await cancelBookRequest(requestId);
      if (result.success) {
        toast.success(result.message || "Request canceled successfully!");
        onOpenChange(false);
        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast.error(result.message || "Failed to cancel request.");
      }
    } catch (error) {
      console.error("Error canceling request:", error);
      toast.error("An error occurred while canceling the request.");
    } finally {
      setIsCanceling(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel Book Request</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to cancel your request for{" "}
            <strong>{request.book.books_name}</strong>? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isCanceling}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleCancel}
            disabled={isCanceling}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isCanceling ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Canceling...
              </>
            ) : (
              "Cancel Request"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

