"use client";

import * as React from "react";
import {
  BookOpen,
  User,
  Hash,
  Building,
  Calendar,
  FileText,
  Copy,
  Tag,
  MapPin,
  Globe,
  Layers,
  Library,
  X,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Package,
} from "lucide-react";
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
import { getBookByIdForStudent } from "@/app/dashboard/student/books/actions";
import { toast } from "sonner";

interface ViewBookDialogForStudentProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookId: number | null;
}

function formatStatus(status: "Available" | "Not_Available" | "Lost" | "Damaged"): string {
  return status.replace(/_/g, " ");
}

function getStatusVariant(
  status: "Available" | "Not_Available" | "Lost" | "Damaged"
): "default" | "secondary" | "destructive" {
  if (status === "Available") return "default";
  if (status === "Not_Available") return "secondary";
  return "destructive";
}

function getStatusIcon(status: "Available" | "Not_Available" | "Lost" | "Damaged") {
  if (status === "Available") return CheckCircle2;
  if (status === "Not_Available") return XCircle;
  return AlertCircle;
}

export function ViewBookDialogForStudent({
  open,
  onOpenChange,
  bookId,
}: ViewBookDialogForStudentProps) {
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
      const book = await getBookByIdForStudent(bookId);
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

  if (!bookId) {
    return null;
  }

  const StatusIcon = bookData?.status ? getStatusIcon(bookData.status) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader className="space-y-3 pb-4 border-b">
          <DialogTitle className="text-2xl font-semibold flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            Book Details
          </DialogTitle>
          <DialogDescription className="text-base">
            Complete information about this book in the library system.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-2">
              <BookOpen className="h-8 w-8 animate-pulse text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">Loading book details...</p>
            </div>
          </div>
        ) : bookData ? (
          <div className="space-y-6 pt-4">
            {/* Header Section with Status */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border border-primary/20">
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">{bookData.books_name}</h2>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span className="text-base">{bookData.author_name}</span>
                </div>
              </div>
              {StatusIcon && (
                <Badge
                  variant={getStatusVariant(bookData.status)}
                  className="font-medium text-sm px-3 py-1.5 flex items-center gap-2"
                >
                  <StatusIcon className="h-4 w-4" />
                  {formatStatus(bookData.status)}
                </Badge>
              )}
            </div>

            {/* Basic Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Basic Information</h3>
              </div>
              <Separator />
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    ISBN
                  </label>
                  <p className="text-sm font-mono bg-muted p-2 rounded-md">
                    {bookData.isbn}
                  </p>
                </div>
                {bookData.publication_year && (
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Publication Year
                    </label>
                    <p className="text-sm bg-muted p-2 rounded-md">
                      {bookData.publication_year}
                    </p>
                  </div>
                )}
                {bookData.publisher && (
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Publisher
                    </label>
                    <p className="text-sm bg-muted p-2 rounded-md">
                      {bookData.publisher}
                    </p>
                  </div>
                )}
                {bookData.edition && (
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Layers className="h-4 w-4" />
                      Edition
                    </label>
                    <p className="text-sm bg-muted p-2 rounded-md">
                      {bookData.edition}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Classification & Organization */}
            {(bookData.subject ||
              bookData.department ||
              bookData.books_type ||
              bookData.books_category ||
              bookData.classification_code ||
              bookData.shelf_location ||
              bookData.language ||
              bookData.format) && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Library className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">
                    Classification & Organization
                  </h3>
                </div>
                <Separator />
                <div className="grid gap-4 md:grid-cols-2">
                  {bookData.subject && (
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        Subject
                      </label>
                      <p className="text-sm bg-muted p-2 rounded-md">
                        {bookData.subject}
                      </p>
                    </div>
                  )}
                  {bookData.department && (
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        Department
                      </label>
                      <Badge variant="outline" className="text-sm p-2 h-auto">
                        {bookData.department}
                      </Badge>
                    </div>
                  )}
                  {bookData.books_type && (
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Book Type
                      </label>
                      <p className="text-sm bg-muted p-2 rounded-md">
                        {bookData.books_type}
                      </p>
                    </div>
                  )}
                  {bookData.books_category && (
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        Category
                      </label>
                      <p className="text-sm bg-muted p-2 rounded-md">
                        {bookData.books_category}
                      </p>
                    </div>
                  )}
                  {bookData.classification_code && (
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Hash className="h-4 w-4" />
                        Classification Code
                      </label>
                      <p className="text-sm font-mono bg-muted p-2 rounded-md">
                        {bookData.classification_code}
                      </p>
                    </div>
                  )}
                  {bookData.shelf_location && (
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Shelf Location
                      </label>
                      <p className="text-sm bg-muted p-2 rounded-md">
                        {bookData.shelf_location}
                      </p>
                    </div>
                  )}
                  {bookData.language && (
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Language
                      </label>
                      <p className="text-sm bg-muted p-2 rounded-md">
                        {bookData.language}
                      </p>
                    </div>
                  )}
                  {bookData.format && (
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Layers className="h-4 w-4" />
                        Format
                      </label>
                      <p className="text-sm bg-muted p-2 rounded-md">
                        {bookData.format}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Inventory & Status */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Copy className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Inventory & Status</h3>
              </div>
              <Separator />
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-1 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
                  <label className="text-sm font-medium text-muted-foreground">
                    Total Copies
                  </label>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {bookData.total_copies ?? 0}
                  </p>
                </div>
                <div className="space-y-1 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
                  <label className="text-sm font-medium text-muted-foreground">
                    Available Copies
                  </label>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {bookData.available_copies ?? 0}
                  </p>
                </div>
                <div className="space-y-1 p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-900">
                  <label className="text-sm font-medium text-muted-foreground">
                    Borrowed Copies
                  </label>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {(bookData.total_copies ?? 0) - (bookData.available_copies ?? 0)}
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            {bookData.description && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Description</h3>
                </div>
                <Separator />
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                    {bookData.description}
                  </p>
                </div>
              </div>
            )}

            {/* Timestamps */}
            {(bookData.created_at || bookData.updated_at) && (
              <div className="space-y-4">
                <Separator />
                <div className="grid gap-4 md:grid-cols-2 text-sm text-muted-foreground">
                  {bookData.created_at && (
                    <div>
                      <span className="font-medium">Created:</span>{" "}
                      {new Date(bookData.created_at).toLocaleString()}
                    </div>
                  )}
                  {bookData.updated_at && (
                    <div>
                      <span className="font-medium">Last Updated:</span>{" "}
                      {new Date(bookData.updated_at).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Close Button */}
            <div className="flex justify-end pt-4 border-t">
              <Button onClick={() => onOpenChange(false)} variant="outline">
                <X className="mr-2 h-4 w-4" />
                Close
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

