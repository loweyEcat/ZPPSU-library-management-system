"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Upload, BookOpen, User, Calendar } from "lucide-react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const adminUploadEbookSchema = z
  .object({
    document_type: z.enum(["Ebooks", "Journal"], {
      message: "Please select a document type",
    }),
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
    cover_photo: z
      .instanceof(File, { message: "Please select a cover image" })
      .optional(),
    file: z.instanceof(File, { message: "Please select a file to upload" }),
  })
  .superRefine((data, ctx) => {
    // File validation based on document type
    if (data.document_type === "Ebooks") {
      // Ebook: Only EPUB
      if (
        data.file.type !== "application/epub+zip" &&
        !data.file.name.toLowerCase().endsWith(".epub")
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Ebooks only accept EPUB format files",
          path: ["file"],
        });
      }
    } else if (data.document_type === "Journal") {
      // Journal: PDF or EPUB
      const isPDF =
        data.file.type === "application/pdf" ||
        data.file.name.toLowerCase().endsWith(".pdf");
      const isEPUB =
        data.file.type === "application/epub+zip" ||
        data.file.name.toLowerCase().endsWith(".epub");
      if (!isPDF && !isEPUB) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Journals only accept PDF or EPUB format files",
          path: ["file"],
        });
      }
    }
  });

type AdminUploadEbookFormValues = z.infer<typeof adminUploadEbookSchema>;

interface AdminUploadEbookFormProps {
  onSuccess?: () => void;
}

export function AdminUploadEbookForm({ onSuccess }: AdminUploadEbookFormProps) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isUploadingFile, setIsUploadingFile] = React.useState(false);

  const form = useForm<AdminUploadEbookFormValues>({
    resolver: zodResolver(adminUploadEbookSchema),
    defaultValues: {
      document_type: "Ebooks",
      title: "",
      author: "",
      isbn: "",
      publisher: "",
      publication_date: "",
      edition: "",
      language: "",
      category: "",
      journal_name: "",
      journal_volume: "",
      journal_issue: "",
      doi: "",
      co_authors: "",
      abstract: "",
      keywords: "",
      cover_photo: undefined,
      file: undefined,
    },
  });

  const documentType = form.watch("document_type");

  const onSubmit = React.useCallback(
    async (values: AdminUploadEbookFormValues) => {
      setError(null);
      setIsSubmitting(true);

      try {
        let fileUrl = "";
        let filePath = "";
        let fileName = "";
        let fileSize = 0;
        let fileType = "";
        let coverImageUrl = "";

        // Validate file
        if (!values.file) {
          setError("Please select a file to upload.");
          setIsSubmitting(false);
          return;
        }

        // Check file type based on document type
        if (values.document_type === "Ebooks") {
          // Ebook: Only EPUB
          if (
            values.file.type !== "application/epub+zip" &&
            !values.file.name.toLowerCase().endsWith(".epub")
          ) {
            setError(
              "Ebooks only accept EPUB format files. Please select an EPUB file."
            );
            setIsSubmitting(false);
            return;
          }
        } else if (values.document_type === "Journal") {
          // Journal: PDF or EPUB
          const isPDF =
            values.file.type === "application/pdf" ||
            values.file.name.toLowerCase().endsWith(".pdf");
          const isEPUB =
            values.file.type === "application/epub+zip" ||
            values.file.name.toLowerCase().endsWith(".epub");
          if (!isPDF && !isEPUB) {
            setError(
              "Journals only accept PDF or EPUB format files. Please select a PDF or EPUB file."
            );
            setIsSubmitting(false);
            return;
          }
        }

        // Upload cover photo if provided
        if (values.cover_photo) {
          setIsUploadingFile(true);
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
            setError(
              errorData.message ??
                "Failed to upload cover image. Please try again."
            );
            setIsSubmitting(false);
            setIsUploadingFile(false);
            return;
          }

          const coverUploadData = await coverUploadResponse.json();
          coverImageUrl = coverUploadData.url;
        }

        // Upload file
        setIsUploadingFile(true);
        const formData = new FormData();
        formData.append("file", values.file);

        // Use different endpoint based on document type
        const uploadEndpoint =
          values.document_type === "Journal"
            ? "/api/upload/journal"
            : "/api/upload/ebook";

        const uploadResponse = await fetch(uploadEndpoint, {
          method: "POST",
          body: formData,
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json().catch(() => ({
            message: `Failed to upload ${
              values.document_type === "Ebooks" ? "EPUB" : "PDF/EPUB"
            } file. Please try again.`,
          }));
          setError(
            errorData.message ??
              `Failed to upload ${
                values.document_type === "Ebooks" ? "EPUB" : "PDF/EPUB"
              } file. Please try again.`
          );
          setIsSubmitting(false);
          setIsUploadingFile(false);
          return;
        }

        const uploadData = await uploadResponse.json();
        fileUrl = uploadData.url;
        filePath = uploadData.pathname;
        fileName = uploadData.fileName;
        fileSize = uploadData.size;
        fileType = uploadData.contentType;
        setIsUploadingFile(false);

        // Create document (ebook or journal)
        const response = await fetch("/api/admin/library/ebook", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            document_type: values.document_type,
            title: values.title,
            researcher_name: values.author,
            abstract: values.abstract || undefined,
            keywords: values.keywords || undefined,
            // Ebook fields
            co_authors:
              values.document_type === "Ebooks"
                ? JSON.stringify({
                    isbn: values.isbn || null,
                    publisher: values.publisher || null,
                    publication_date: values.publication_date || null,
                    edition: values.edition || null,
                    language: values.language || null,
                    category: values.category || null,
                  })
                : values.co_authors || undefined,
            // Journal fields
            journal_name:
              values.document_type === "Journal"
                ? values.journal_name || undefined
                : undefined,
            journal_volume:
              values.document_type === "Journal"
                ? values.journal_volume || undefined
                : undefined,
            journal_issue:
              values.document_type === "Journal"
                ? values.journal_issue || undefined
                : undefined,
            doi:
              values.document_type === "Journal"
                ? values.doi || undefined
                : undefined,
            // Cover image (for both ebooks and journals)
            ebook_cover_image: coverImageUrl || undefined,
            file_url: fileUrl,
            file_name: fileName,
            file_size: fileSize,
            file_type: fileType,
            file_path: filePath,
          }),
        });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({
            message: `Failed to create ${values.document_type.toLowerCase()} document. Please try again.`,
          }));
          setError(
            errorBody.message ??
              `Failed to create ${values.document_type.toLowerCase()} document. Please try again.`
          );
          setIsSubmitting(false);
          return;
        }

        toast.success(
          `${
            values.document_type === "Ebooks" ? "Ebook" : "Journal"
          } uploaded successfully.`
        );
        form.reset();
        setIsSubmitting(false);
        if (onSuccess) {
          onSuccess();
        }
        router.refresh();
      } catch (error) {
        console.error("Failed to upload ebook:", error);
        setError("An unexpected error occurred. Please try again.");
        setIsSubmitting(false);
        setIsUploadingFile(false);
      }
    },
    [form, router, onSuccess]
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <div className="p-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
            {error}
          </div>
        )}

        {/* Document Type Selector */}
        <FormField
          control={form.control}
          name="document_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-medium">Document Type *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Ebooks">Ebook</SelectItem>
                  <SelectItem value="Journal">Journal</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Select whether you're uploading an Ebook or Journal document.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Separator />

        {/* Document Information */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">
              {documentType === "Ebooks"
                ? "Ebook Information"
                : "Journal Information"}
            </h3>
          </div>

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-medium">
                  {documentType === "Ebooks"
                    ? "Book Title *"
                    : "Article Title *"}
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
                  Enter the author(s) of the book. Separate multiple authors
                  with commas.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Ebook-specific fields */}
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
                          placeholder="e.g., 978-0-123456-78-9"
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
            </>
          )}

          {/* Journal-specific fields */}
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
                        placeholder="e.g., Nature, Science, IEEE"
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
                          placeholder="e.g., 15"
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
                          placeholder="e.g., 10.1234/example.doi"
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
                          placeholder="Enter co-author names, separated by commas"
                          disabled={isSubmitting}
                          className="h-11"
                        />
                      </FormControl>
                      <FormDescription>
                        Optional. Enter co-author names separated by commas.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </>
          )}

          {/* Ebook-specific fields continued */}
          {documentType === "Ebooks" && (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="publication_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">
                        Publication Date
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={field.value || ""}
                          disabled={isSubmitting}
                          className="h-11"
                        />
                      </FormControl>
                      <FormDescription>
                        Select the publication date of the book.
                      </FormDescription>
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
                          placeholder="e.g., English, Spanish, French"
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
                      <FormLabel className="font-medium">
                        Category/Genre
                      </FormLabel>
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

          {/* Common fields */}
          <FormField
            control={form.control}
            name="abstract"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-medium">
                  Description/Summary
                </FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Enter book description or summary (optional)"
                    disabled={isSubmitting}
                    rows={4}
                    className="resize-none"
                  />
                </FormControl>
                <FormDescription>
                  Optional. Provide a brief description or summary.
                </FormDescription>
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

          <Separator />

          {/* Cover Photo */}
          <FormField
            control={form.control}
            name="cover_photo"
            render={({ field: { value, onChange, ...fieldProps } }) => (
              <FormItem>
                <FormLabel className="font-medium">Cover Photo</FormLabel>
                <FormControl>
                  <div className="space-y-4">
                    <Input
                      {...fieldProps}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      disabled={isSubmitting || isUploadingFile}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) {
                          const maxSize = 5 * 1024 * 1024;
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
                        }
                      }}
                      className="cursor-pointer h-11"
                    />
                    {value && (
                      <div className="flex items-center gap-4">
                        <div className="relative w-32 h-48 border-2 border-dashed border-muted-foreground/25 rounded-lg overflow-hidden bg-muted/50">
                          <img
                            src={URL.createObjectURL(value)}
                            alt="Cover preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 text-sm text-muted-foreground">
                          <p className="font-medium">{value.name}</p>
                          <p>{(value.size / (1024 * 1024)).toFixed(2)} MB</p>
                        </div>
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormDescription>
                  Optional. Upload a cover image (JPEG, PNG, or WebP, max 5MB).
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Separator />

          {/* File Upload */}
          <FormField
            control={form.control}
            name="file"
            render={({ field: { value, onChange, ...fieldProps } }) => (
              <FormItem>
                <FormLabel className="font-medium">
                  {documentType === "Ebooks"
                    ? "EPUB File *"
                    : "PDF/EPUB File *"}
                </FormLabel>
                <FormControl>
                  <Input
                    {...fieldProps}
                    type="file"
                    accept={
                      documentType === "Ebooks"
                        ? ".epub,application/epub+zip"
                        : ".pdf,.epub,application/pdf,application/epub+zip"
                    }
                    disabled={isSubmitting || isUploadingFile}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) {
                        // Validate file type based on document type
                        if (documentType === "Ebooks") {
                          // Ebook: Only EPUB
                          if (
                            file.type !== "application/epub+zip" &&
                            !file.name.toLowerCase().endsWith(".epub")
                          ) {
                            toast.error(
                              "Ebooks only accept EPUB format files. Please select an EPUB file."
                            );
                            return;
                          }
                        } else if (documentType === "Journal") {
                          // Journal: PDF or EPUB
                          const isPDF =
                            file.type === "application/pdf" ||
                            file.name.toLowerCase().endsWith(".pdf");
                          const isEPUB =
                            file.type === "application/epub+zip" ||
                            file.name.toLowerCase().endsWith(".epub");
                          if (!isPDF && !isEPUB) {
                            toast.error(
                              "Journals only accept PDF or EPUB format files. Please select a PDF or EPUB file."
                            );
                            return;
                          }
                        }
                        // Validate file size (max 50MB)
                        const maxSize = 50 * 1024 * 1024;
                        if (file.size > maxSize) {
                          toast.error("File size must be less than 50MB");
                          return;
                        }
                        onChange(file);
                      }
                    }}
                    className="cursor-pointer h-11"
                  />
                </FormControl>
                <FormDescription>
                  {documentType === "Ebooks"
                    ? "Upload EPUB file only (max 50MB). Other formats will be rejected."
                    : "Upload PDF or EPUB file (max 50MB). Other formats will be rejected."}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Submit Button */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
          <Button
            type="submit"
            className="w-full sm:flex-1"
            disabled={isSubmitting || isUploadingFile}
            size="lg"
          >
            {isSubmitting || isUploadingFile ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isUploadingFile ? "Uploading File…" : "Uploading…"}
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload {documentType === "Ebooks" ? "Ebook" : "Journal"}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
