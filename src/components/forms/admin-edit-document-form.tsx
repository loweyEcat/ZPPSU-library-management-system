"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, BookOpen, User, Calendar, Image, X } from "lucide-react";

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
import { Separator } from "@/components/ui/separator";

const adminEditDocumentSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(255, "Title must not exceed 255 characters"),
  author: z
    .string()
    .min(1, "Author is required")
    .max(500, "Author must not exceed 500 characters"),
  // Ebook fields
  isbn: z.string().max(50, "ISBN must not exceed 50 characters").optional(),
  publisher: z
    .string()
    .max(255, "Publisher must not exceed 255 characters")
    .optional(),
  publication_date: z
    .string()
    .max(50, "Publication date must not exceed 50 characters")
    .optional(),
  edition: z
    .string()
    .max(50, "Edition must not exceed 50 characters")
    .optional(),
  language: z
    .string()
    .max(50, "Language must not exceed 50 characters")
    .optional(),
  category: z
    .string()
    .max(100, "Category must not exceed 100 characters")
    .optional(),
  // Journal fields
  journal_name: z
    .string()
    .max(255, "Journal name must not exceed 255 characters")
    .optional(),
  journal_volume: z
    .string()
    .max(50, "Journal volume must not exceed 50 characters")
    .optional(),
  journal_issue: z
    .string()
    .max(50, "Journal issue must not exceed 50 characters")
    .optional(),
  doi: z.string().max(100, "DOI must not exceed 100 characters").optional(),
  co_authors: z.string().optional(),
  // Common fields
  abstract: z.string().optional(),
  keywords: z
    .string()
    .max(500, "Keywords must not exceed 500 characters")
    .optional(),
  cover_photo: z.instanceof(File).optional(),
});

type AdminEditDocumentFormValues = z.infer<typeof adminEditDocumentSchema>;

interface PublishedDocument {
  id: number;
  title: string;
  researcher_name: string;
  document_type: string | null;
  abstract?: string | null;
  keywords?: string | null;
  journal_name?: string | null;
  journal_volume?: string | null;
  journal_issue?: string | null;
  doi?: string | null;
  co_authors?: string | null;
  ebook_cover_image?: string | null;
  [key: string]: any;
}

interface AdminEditDocumentFormProps {
  document: PublishedDocument;
  onSuccess?: () => void;
}

export function AdminEditDocumentForm({
  document,
  onSuccess,
}: AdminEditDocumentFormProps) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isUploadingCover, setIsUploadingCover] = React.useState(false);
  const [coverPreview, setCoverPreview] = React.useState<string | null>(
    document.ebook_cover_image || null
  );
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Parse ebook metadata from co_authors if it's JSON
  let ebookData: any = {};
  if (document.document_type === "Ebooks" && document.co_authors) {
    try {
      ebookData = JSON.parse(document.co_authors);
    } catch (e) {
      // If parsing fails, use empty object
    }
  }

  const form = useForm<AdminEditDocumentFormValues>({
    resolver: zodResolver(adminEditDocumentSchema),
    defaultValues: {
      title: document.title || "",
      author: document.researcher_name || "",
      // Ebook fields
      isbn: ebookData.isbn || "",
      publisher: ebookData.publisher || "",
      publication_date: ebookData.publication_date || "",
      edition: ebookData.edition || "",
      language: ebookData.language || "",
      category: ebookData.category || "",
      // Journal fields
      journal_name: document.journal_name || "",
      journal_volume: document.journal_volume || "",
      journal_issue: document.journal_issue || "",
      doi: document.doi || "",
      co_authors:
        document.document_type === "Journal"
          ? document.co_authors || ""
          : "",
      // Common fields
      abstract: document.abstract || "",
      keywords: document.keywords || "",
    },
  });

  const documentType = document.document_type;

  const onSubmit = React.useCallback(
    async (values: AdminEditDocumentFormValues) => {
      setIsSubmitting(true);
      setError(null);

      try {
        let coverImageUrl = document.ebook_cover_image || null;

        // Upload cover photo if provided (for both Ebooks and Journals)
        if (values.cover_photo && (documentType === "Ebooks" || documentType === "Journal")) {
          setIsUploadingCover(true);
          const coverFormData = new FormData();
          coverFormData.append("file", values.cover_photo);

          const coverUploadResponse = await fetch("/api/upload/ebook-cover", {
            method: "POST",
            body: coverFormData,
          });

          if (!coverUploadResponse.ok) {
            const errorData = await coverUploadResponse.json().catch(() => ({
              message: "Failed to upload cover image. Please try again.",
            }));
            setError(errorData.message ?? "Failed to upload cover image. Please try again.");
            setIsSubmitting(false);
            setIsUploadingCover(false);
            return;
          }

          const coverUploadData = await coverUploadResponse.json();
          coverImageUrl = coverUploadData.url;
          setIsUploadingCover(false);
        }

        // Prepare update data
        let updateData: any = {
          title: values.title,
          researcher_name: values.author,
          abstract: values.abstract || null,
          keywords: values.keywords || null,
        };

        // Add cover image URL if uploaded or if it already exists
        if (coverImageUrl) {
          updateData.ebook_cover_image = coverImageUrl;
        }

        if (documentType === "Ebooks") {
          // For ebooks, store metadata in co_authors as JSON
          const ebookMetadata = {
            isbn: values.isbn || null,
            publisher: values.publisher || null,
            publication_date: values.publication_date || null,
            edition: values.edition || null,
            language: values.language || null,
            category: values.category || null,
          };
          updateData.co_authors = JSON.stringify(ebookMetadata);
        } else if (documentType === "Journal") {
          updateData.journal_name = values.journal_name || null;
          updateData.journal_volume = values.journal_volume || null;
          updateData.journal_issue = values.journal_issue || null;
          updateData.doi = values.doi || null;
          updateData.co_authors = values.co_authors || null;
        }

        const response = await fetch(`/api/admin/library/document/${document.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.message || "Failed to update document.");
          setIsSubmitting(false);
          return;
        }

        toast.success("Document updated successfully.");
        setIsSubmitting(false);
        if (onSuccess) {
          onSuccess();
        }
        router.refresh();
      } catch (error) {
        console.error("Failed to update document:", error);
        setError("Network error. Please try again.");
        setIsSubmitting(false);
        setIsUploadingCover(false);
      }
    },
    [document.id, document.ebook_cover_image, documentType, router, onSuccess]
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <div className="p-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
            {error}
          </div>
        )}

        <Separator />

        {/* Document Information */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">
              {documentType === "Ebooks" ? "Ebook" : "Journal"} Information
            </h3>
          </div>

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-medium">
                  {documentType === "Ebooks" ? "Book Title" : "Article Title"} *
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder={
                      documentType === "Ebooks"
                        ? "Enter the book title"
                        : "Enter the article title"
                    }
                    disabled={isSubmitting}
                    className="h-11"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="author"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-medium flex items-center gap-2">
                  <User className="h-3.5 w-3.5" />
                  Author(s) *
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Enter author name(s), separate multiple authors with commas"
                    disabled={isSubmitting}
                    className="h-11"
                  />
                </FormControl>
                <FormDescription>
                  Enter the author(s). Separate multiple authors with commas.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {documentType === "Ebooks" && (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="isbn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">ISBN</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., 978-3-16-148410-0"
                          disabled={isSubmitting}
                          className="h-11"
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
                      <FormLabel className="font-medium">Publisher</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., Penguin Random House"
                          disabled={isSubmitting}
                          className="h-11"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="publication_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">Publication Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={field.value || ""}
                          disabled={isSubmitting}
                          className="h-11"
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
                      <FormLabel className="font-medium">Edition</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., 1st Edition, 2nd Edition"
                          disabled={isSubmitting}
                          className="h-11"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">Language</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., English, Filipino"
                          disabled={isSubmitting}
                          className="h-11"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">Category/Genre</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., Fiction, Non-Fiction, Science, History"
                          disabled={isSubmitting}
                          className="h-11"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </>
          )}

          {documentType === "Journal" && (
            <>
              <FormField
                control={form.control}
                name="journal_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">Journal Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter journal name"
                        disabled={isSubmitting}
                        className="h-11"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="journal_volume"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">Volume</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., 10"
                          disabled={isSubmitting}
                          className="h-11"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="journal_issue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">Issue</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., 3"
                          disabled={isSubmitting}
                          className="h-11"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="doi"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">DOI</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., 10.1000/182"
                          disabled={isSubmitting}
                          className="h-11"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="co_authors"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">Co-Authors</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter co-authors, separated by commas"
                          disabled={isSubmitting}
                          className="h-11"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </>
          )}

          <FormField
            control={form.control}
            name="abstract"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-medium">
                  {documentType === "Ebooks" ? "Description/Summary" : "Abstract"}
                </FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder={
                      documentType === "Ebooks"
                        ? "Enter book description or summary"
                        : "Enter abstract"
                    }
                    disabled={isSubmitting}
                    rows={4}
                    className="resize-none"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="keywords"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-medium">Keywords/Tags</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="e.g., programming, fiction, science, history"
                    disabled={isSubmitting}
                    className="h-11"
                  />
                </FormControl>
                <FormDescription>
                  Optional. Separate keywords with commas.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Cover Photo Upload - For both Ebooks and Journals */}
          {(documentType === "Ebooks" || documentType === "Journal") && (
            <FormField
              control={form.control}
              name="cover_photo"
              render={({ field: { value, onChange, ...fieldProps } }) => (
                <FormItem>
                  <FormLabel className="font-medium flex items-center gap-2">
                    <Image className="h-4 w-4" />
                    Cover Photo
                  </FormLabel>
                  <FormControl>
                    <div className="space-y-4">
                      <Input
                        {...fieldProps}
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        disabled={isSubmitting || isUploadingCover}
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) {
                            const maxSize = 5 * 1024 * 1024; // 5MB
                            if (file.size > maxSize) {
                              toast.error(
                                "Cover image size must be less than 5MB"
                              );
                              return;
                            }
                            const allowedTypes = [
                              "image/jpeg",
                              "image/jpg",
                              "image/png",
                              "image/webp",
                            ];
                            if (!allowedTypes.includes(file.type)) {
                              toast.error(
                                "Please upload an image (JPEG, PNG, or WebP)"
                              );
                              return;
                            }
                            onChange(file);
                            // Create preview
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setCoverPreview(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="cursor-pointer h-11"
                      />
                      {(coverPreview || document.ebook_cover_image) && (
                        <div className="flex items-center gap-4">
                          <div className="relative w-32 h-48 border rounded-md overflow-hidden bg-muted">
                            <img
                              src={coverPreview || document.ebook_cover_image || ""}
                              alt="Cover preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-muted-foreground">
                              {coverPreview
                                ? "New cover image selected"
                                : "Current cover image"}
                            </p>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="mt-2"
                              onClick={() => {
                                onChange(undefined);
                                setCoverPreview(document.ebook_cover_image || null);
                                // Reset file input
                                if (fileInputRef.current) {
                                  fileInputRef.current.value = "";
                                }
                              }}
                              disabled={isSubmitting || isUploadingCover}
                            >
                              <X className="h-4 w-4 mr-2" />
                              {coverPreview && coverPreview !== document.ebook_cover_image
                                ? "Remove New Image"
                                : "Remove"}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription>
                    Optional. Upload a cover image for the{" "}
                    {documentType === "Ebooks" ? "ebook" : "journal"}. Maximum
                    size: 5MB. Supported formats: JPEG, PNG, WebP.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <Separator />

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => form.reset()}
            disabled={isSubmitting}
          >
            Reset
          </Button>
          <Button type="submit" disabled={isSubmitting || isUploadingCover}>
            {isSubmitting || isUploadingCover ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isUploadingCover ? "Uploading Cover..." : "Updating..."}
              </>
            ) : (
              <>
                <BookOpen className="mr-2 h-4 w-4" />
                Update Document
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

