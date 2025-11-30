"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

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
import { deleteBook } from "@/app/admin/books/actions";

interface DeleteBookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookId: number | null;
  bookTitle?: string;
}

export function DeleteBookDialog({
  open,
  onOpenChange,
  bookId,
  bookTitle,
}: DeleteBookDialogProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDelete = React.useCallback(async () => {
    if (!bookId) return;

    setIsDeleting(true);
    try {
      const result = await deleteBook(bookId);

      if (!result.success) {
        toast.error(result.message || "Failed to delete book.");
        setIsDeleting(false);
        return;
      }

      toast.success("Book deleted successfully!");
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      console.error("Error deleting book:", error);
      toast.error("An unexpected error occurred. Please try again.");
      setIsDeleting(false);
    }
  }, [bookId, router, onOpenChange]);

  if (!bookId) {
    return null;
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the book
            {bookTitle && (
              <>
                {" "}
                <span className="font-semibold">"{bookTitle}"</span>
              </>
            )}
            . All associated borrow requests will also be deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

