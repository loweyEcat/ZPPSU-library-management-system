"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BookEditForm } from "@/components/forms/book-edit-form";
import { getBookById } from "@/app/admin/books/actions";
import { toast } from "sonner";

interface EditBookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookId: number | null;
}

export function EditBookDialog({
  open,
  onOpenChange,
  bookId,
}: EditBookDialogProps) {
  const router = useRouter();
  const [bookData, setBookData] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (open && bookId) {
      loadBookData();
    } else {
      setBookData(null);
    }
  }, [open, bookId]);

  const loadBookData = async () => {
    if (!bookId) return;

    setIsLoading(true);
    try {
      const book = await getBookById(bookId);
      if (book) {
        setBookData(book);
      } else {
        toast.error("Book not found.");
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Error loading book:", error);
      toast.error("Failed to load book data.");
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccess = React.useCallback(() => {
    onOpenChange(false);
    router.refresh();
  }, [router, onOpenChange]);

  if (!bookId) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto sm:max-h-[90vh]">
        <DialogHeader className="space-y-3 pb-4 border-b">
          <DialogTitle className="text-2xl font-semibold">Edit Book</DialogTitle>
          <DialogDescription className="text-base">
            Update the book information below. Fields marked with * are required.
          </DialogDescription>
        </DialogHeader>
        <div className="pt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-2">
                <BookOpen className="h-8 w-8 animate-pulse text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground">Loading book data...</p>
              </div>
            </div>
          ) : bookData ? (
            <BookEditForm
              bookId={bookId}
              initialData={bookData}
              onSuccess={handleSuccess}
            />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

