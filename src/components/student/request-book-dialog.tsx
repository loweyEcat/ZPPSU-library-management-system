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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, Package, BookOpen, Copy } from "lucide-react";
import { createBookRequest } from "@/app/dashboard/student/books/actions";
import { toast } from "sonner";
import { lib_books_status } from "../../../generated/prisma/enums";

interface Book {
  id: number;
  books_name: string;
  author_name: string;
  isbn: string;
  available_copies: number | null;
  remaining_available_copies: number;
  total_copies: number | null;
  status: lib_books_status;
}

interface RequestBookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  book: Book | null;
  onSuccess?: () => void;
}

export function RequestBookDialog({
  open,
  onOpenChange,
  book,
  onSuccess,
}: RequestBookDialogProps) {
  const [quantity, setQuantity] = React.useState<string>("1");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Reset quantity when dialog opens/closes or book changes
  React.useEffect(() => {
    if (open && book) {
      setQuantity("1");
    }
  }, [open, book]);

  const remainingAvailableCopies = book?.remaining_available_copies ?? 0;
  const maxQuantity = remainingAvailableCopies;

  const handleSubmit = async () => {
    if (!book) return;

    const qty = parseInt(quantity);

    // Validation
    if (isNaN(qty) || qty < 1) {
      toast.error("Please enter a valid quantity (minimum 1).");
      return;
    }

    if (qty > maxQuantity) {
      toast.error(`You can only request up to ${maxQuantity} copy/copies.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createBookRequest(book.id, qty);
      if (result.success) {
        toast.success(result.message || "Book request submitted successfully!");
        onOpenChange(false);
        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast.error(result.message || "Failed to submit book request.");
      }
    } catch (error) {
      console.error("Error requesting book:", error);
      toast.error("An error occurred while submitting the request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!book) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" />
            Request to Borrow Book
          </DialogTitle>
          <DialogDescription>
            Confirm your book request and specify the quantity you want to
            borrow.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Book Information */}
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Book Information
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Title: </span>
                <span className="font-medium">{book.books_name}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Author: </span>
                <span className="font-medium">{book.author_name}</span>
              </div>
              <div>
                <span className="text-muted-foreground">ISBN: </span>
                <span className="font-mono font-medium">{book.isbn}</span>
              </div>
            </div>
          </div>

          {/* Availability Information */}
          <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Copy className="h-4 w-4" />
              Availability
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Total Copies: </span>
                <span className="font-semibold">{book.total_copies ?? 0}</span>
              </div>
              <div>
                <span className="text-muted-foreground">
                  Available Copies:{" "}
                </span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  {remainingAvailableCopies}
                </span>
              </div>
            </div>
          </div>

          {/* Quantity Input */}
          <div className="space-y-2">
            <Label htmlFor="quantity">
              Quantity to Borrow <span className="text-destructive">*</span>
            </Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              max={maxQuantity}
              value={quantity}
              onChange={(e) => {
                const value = e.target.value;
                if (
                  value === "" ||
                  (parseInt(value) >= 1 && parseInt(value) <= maxQuantity)
                ) {
                  setQuantity(value);
                }
              }}
              placeholder="Enter quantity"
              disabled={isSubmitting || remainingAvailableCopies === 0}
              className="text-lg font-medium"
            />
            <p className="text-xs text-muted-foreground">
              You can request up to <strong>{maxQuantity}</strong> copy/copies.
              {parseInt(quantity) === maxQuantity && maxQuantity > 0 && (
                <span className="block mt-1 text-orange-600 dark:text-orange-400 font-medium">
                  Note: Requesting all available copies will remove this book
                  from the Books tab.
                </span>
              )}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                isSubmitting ||
                remainingAvailableCopies === 0 ||
                !quantity ||
                parseInt(quantity) < 1 ||
                parseInt(quantity) > maxQuantity
              }
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Package className="mr-2 h-4 w-4" />
                  Request to Borrow
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
