"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Loader2,
  BookOpen,
  Hash,
  Building,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { updateBook } from "@/app/admin/books/actions";

const bookEditFormSchema = z.object({
  books_name: z
    .string()
    .min(1, "Book title is required")
    .max(255, "Book title must not exceed 255 characters"),
  author_name: z
    .string()
    .min(1, "Author name is required")
    .max(255, "Author name must not exceed 255 characters"),
  isbn: z
    .string()
    .min(1, "ISBN is required")
    .max(50, "ISBN must not exceed 50 characters"),
  publisher: z
    .string()
    .max(150, "Publisher must not exceed 150 characters")
    .optional(),
  publication_year: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val === "") return true;
        const year = parseInt(val);
        return (
          !isNaN(year) && year >= 1000 && year <= new Date().getFullYear() + 1
        );
      },
      {
        message: "Please enter a valid year",
      }
    ),
  edition: z
    .string()
    .max(50, "Edition must not exceed 50 characters")
    .optional(),
  subject: z
    .string()
    .max(100, "Subject must not exceed 100 characters")
    .optional(),
  department: z
    .string()
    .max(100, "Department must not exceed 100 characters")
    .optional(),
  books_type: z
    .string()
    .max(50, "Book type must not exceed 50 characters")
    .optional(),
  books_category: z
    .string()
    .max(50, "Book category must not exceed 50 characters")
    .optional(),
  description: z.string().optional(),
  language: z
    .string()
    .max(50, "Language must not exceed 50 characters")
    .optional(),
  classification_code: z
    .string()
    .max(50, "Classification code must not exceed 50 characters")
    .optional(),
  shelf_location: z
    .string()
    .max(50, "Shelf location must not exceed 50 characters")
    .optional(),
  format: z.string().max(50, "Format must not exceed 50 characters").optional(),
  total_copies: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val === "") return true;
        const num = parseInt(val);
        return !isNaN(num) && num > 0;
      },
      {
        message: "Total copies must be a positive number",
      }
    ),
  available_copies: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val === "") return true;
        const num = parseInt(val);
        return !isNaN(num) && num >= 0;
      },
      {
        message: "Available copies must be a non-negative number",
      }
    ),
  status: z.enum(["Available", "Not_Available", "Lost", "Damaged"]).optional(),
});

type BookEditFormValues = z.infer<typeof bookEditFormSchema>;

interface BookEditFormProps {
  bookId: number;
  initialData: {
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
    status: "Available" | "Not_Available" | "Lost" | "Damaged" | null;
  };
  onSuccess?: () => void;
}

export function BookEditForm({
  bookId,
  initialData,
  onSuccess,
}: BookEditFormProps) {
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<BookEditFormValues>({
    resolver: zodResolver(bookEditFormSchema),
    defaultValues: {
      books_name: initialData.books_name || "",
      author_name: initialData.author_name || "",
      isbn: initialData.isbn || "",
      publisher: initialData.publisher || "",
      publication_year: initialData.publication_year?.toString() || "",
      edition: initialData.edition || "",
      subject: initialData.subject || "",
      department: initialData.department || "",
      books_type: initialData.books_type || "",
      books_category: initialData.books_category || "",
      description: initialData.description || "",
      language: initialData.language || "",
      classification_code: initialData.classification_code || "",
      shelf_location: initialData.shelf_location || "",
      format: initialData.format || "",
      total_copies: initialData.total_copies?.toString() || "1",
      available_copies: initialData.available_copies?.toString() || "1",
      status: initialData.status || "Available",
    },
  });

  const onSubmit = React.useCallback(
    async (values: BookEditFormValues) => {
      setError(null);
      setIsSubmitting(true);

      try {
        // Validate available copies doesn't exceed total copies
        const totalCopies = values.total_copies
          ? parseInt(values.total_copies)
          : 1;
        const availableCopies = values.available_copies
          ? parseInt(values.available_copies)
          : totalCopies;

        if (availableCopies > totalCopies) {
          setError("Available copies cannot exceed total copies");
          setIsSubmitting(false);
          return;
        }

        const result = await updateBook(bookId, {
          books_name: values.books_name,
          author_name: values.author_name,
          isbn: values.isbn,
          publisher: values.publisher || null,
          publication_year: values.publication_year
            ? parseInt(values.publication_year)
            : null,
          edition: values.edition || null,
          subject: values.subject || null,
          department: values.department || null,
          books_type: values.books_type || null,
          books_category: values.books_category || null,
          description: values.description || null,
          language: values.language || null,
          classification_code: values.classification_code || null,
          shelf_location: values.shelf_location || null,
          format: values.format || null,
          total_copies: totalCopies,
          available_copies: availableCopies,
          status: values.status || "Available",
        });

        if (!result.success) {
          setError(result.message || "Failed to update book. Please try again.");
          return;
        }

        toast.success("Book updated successfully!");
        if (onSuccess) {
          onSuccess();
        }
      } catch (err) {
        console.error("Error updating book:", err);
        setError("An unexpected error occurred. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [bookId, form, onSuccess]
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Basic Information */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Basic Information</h3>
          </div>
          <Separator />

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="books_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">Book Title *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={isSubmitting}
                      className="h-11"
                      placeholder="Enter book title"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="author_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">Author Name *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={isSubmitting}
                      className="h-11"
                      placeholder="Enter author name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isbn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">ISBN *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={isSubmitting}
                      className="h-11 font-mono"
                      placeholder="Enter ISBN"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="publisher"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">Publisher</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={isSubmitting}
                      className="h-11"
                      placeholder="Enter publisher name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="publication_year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">
                    Publication Year
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      disabled={isSubmitting}
                      className="h-11"
                      placeholder="e.g., 2024"
                      min="1000"
                      max={new Date().getFullYear() + 1}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="edition"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">Edition</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={isSubmitting}
                      className="h-11"
                      placeholder="e.g., 1st Edition"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Classification & Organization */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Hash className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">
              Classification & Organization
            </h3>
          </div>
          <Separator />

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">Subject</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={isSubmitting}
                      className="h-11"
                      placeholder="Enter subject"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">Department</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={isSubmitting}
                      className="h-11"
                      placeholder="Enter department"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="books_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">Book Type</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={isSubmitting}
                      className="h-11"
                      placeholder="Enter book type"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="books_category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">Category</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={isSubmitting}
                      className="h-11"
                      placeholder="Enter category"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="classification_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">
                    Classification Code
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={isSubmitting}
                      className="h-11"
                      placeholder="Enter classification code"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="shelf_location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">
                    Shelf Location
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={isSubmitting}
                      className="h-11"
                      placeholder="Enter shelf location"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="language"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">Language</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={isSubmitting}
                      className="h-11"
                      placeholder="e.g., English"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="format"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">Format</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={isSubmitting}
                      className="h-11"
                      placeholder="e.g., Hardcover, Paperback"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Inventory & Status */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Building className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Inventory & Status</h3>
          </div>
          <Separator />

          <div className="grid gap-4 md:grid-cols-3">
            <FormField
              control={form.control}
              name="total_copies"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">Total Copies</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      disabled={isSubmitting}
                      className="h-11"
                      placeholder="1"
                      min="1"
                    />
                  </FormControl>
                  <FormDescription>Total number of copies</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="available_copies"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">
                    Available Copies
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      disabled={isSubmitting}
                      className="h-11"
                      placeholder="1"
                      min="0"
                    />
                  </FormControl>
                  <FormDescription>Number of available copies</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Available">Available</SelectItem>
                      <SelectItem value="Not_Available">
                        Not Available
                      </SelectItem>
                      <SelectItem value="Lost">Lost</SelectItem>
                      <SelectItem value="Damaged">Damaged</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Additional Information</h3>
          </div>
          <Separator />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold">Description</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    disabled={isSubmitting}
                    className="min-h-[100px] resize-none"
                    placeholder="Enter book description..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4 pt-4 border-t">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="min-w-[120px] h-11"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <BookOpen className="mr-2 h-4 w-4" />
                Update Book
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

