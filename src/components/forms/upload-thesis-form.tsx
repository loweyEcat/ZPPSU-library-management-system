"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Loader2,
  Upload,
  FileText,
  User,
  BookOpen,
  Calendar,
  GraduationCap,
  Tag,
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
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { MultiNameInput } from "@/components/ui/multi-name-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const createUploadThesisSchema = (isEdit: boolean) =>
  z.object({
    document_type: z.enum(["Thesis", "Journal", "Capstone", "Ebooks"], {
      message: "Please select a document type",
    }),
    title: z
      .string()
      .max(255, "Title must not exceed 255 characters")
      .optional(),
    researcher_names: z
      .array(z.string().min(1, "Researcher name cannot be empty"))
      .optional(),
    abstract: z.string().optional(),
    keywords: z
      .string()
      .max(500, "Keywords must not exceed 500 characters")
      .optional(),
    department: z
      .string()
      .max(100, "Department must not exceed 100 characters")
      .optional(),
    year_level: z
      .string()
      .max(50, "Year level must not exceed 50 characters")
      .optional(),
    academic_year: z
      .string()
      .max(20, "Academic year must not exceed 20 characters")
      .optional(),
    semester: z
      .string()
      .max(20, "Semester must not exceed 20 characters")
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
    // Thesis fields
    adviser_name: z
      .string()
      .max(255, "Adviser name must not exceed 255 characters")
      .optional(),
    // Capstone fields
    team_members: z.string().optional(),
    project_type: z
      .string()
      .max(100, "Project type must not exceed 100 characters")
      .optional(),
    capstone_category: z
      .string()
      .max(50, "Capstone category must not exceed 50 characters")
      .optional(),
    program: z
      .string()
      .max(100, "Program must not exceed 100 characters")
      .optional(),
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
    author: z
      .string()
      .max(500, "Author must not exceed 500 characters")
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
    cover_photo: isEdit
      ? z
          .instanceof(File, { message: "Please select a cover image" })
          .optional()
      : z
          .instanceof(File, { message: "Please select a cover image" })
          .optional(),
    file: isEdit
      ? z
          .instanceof(File, { message: "Please select a file to upload" })
          .optional()
      : z.instanceof(File, { message: "Please select a file to upload" }),
  });

type UploadThesisFormValues = z.infer<
  ReturnType<typeof createUploadThesisSchema>
>;

interface UploadThesisFormProps {
  onSuccess?: () => void;
  initialData?: {
    id: number;
    document_type?: string;
    title: string;
    researcher_name: string;
    abstract?: string | null;
    keywords?: string | null;
    department?: string | null;
    year_level?: string | null;
    academic_year?: string | null;
    semester?: string | null;
    journal_name?: string | null;
    journal_volume?: string | null;
    journal_issue?: string | null;
    doi?: string | null;
    co_authors?: string | null;
    adviser_name?: string | null;
    team_members?: string | null;
    project_type?: string | null;
    capstone_category?: string | null;
    program?: string | null;
    isbn?: string | null;
    publisher?: string | null;
    publication_date?: string | null;
    author?: string | null;
    edition?: string | null;
    language?: string | null;
    category?: string | null;
    ebook_cover_image?: string | null;
  };
  isEdit?: boolean;
}

export function UploadThesisForm({
  onSuccess,
  initialData,
  isEdit = false,
}: UploadThesisFormProps) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isUploadingFile, setIsUploadingFile] = React.useState(false);

  const uploadThesisSchema = React.useMemo(() => {
    const baseSchema = createUploadThesisSchema(isEdit);
    return baseSchema.superRefine((data, ctx) => {
      // For Thesis and Capstone, title and researcher_names are required
      if (
        data.document_type === "Thesis" ||
        data.document_type === "Capstone"
      ) {
        if (!data.title || data.title.trim().length === 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Title is required for Thesis and Capstone documents",
            path: ["title"],
          });
        }
        if (!data.researcher_names || data.researcher_names.length === 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              "At least one researcher name is required for Thesis and Capstone documents",
            path: ["researcher_names"],
          });
        }
      }
      // For Ebooks, title and author are required
      if (data.document_type === "Ebooks") {
        if (!data.title || data.title.trim().length === 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Book title is required for Ebook documents",
            path: ["title"],
          });
        }
        if (!data.author || data.author.trim().length === 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Author is required for Ebook documents",
            path: ["author"],
          });
        }
      }
    });
  }, [isEdit]);

  // Parse researcher_name from initialData (comma-separated string) to array
  const parseResearcherNames = (names: string | undefined): string[] => {
    if (!names) return [];
    return names
      .split(",")
      .map((name) => name.trim())
      .filter((name) => name.length > 0);
  };

  const form = useForm<UploadThesisFormValues>({
    resolver: zodResolver(uploadThesisSchema),
    defaultValues: {
      document_type:
        (initialData?.document_type as "Thesis" | "Journal" | "Capstone") ||
        "Thesis",
      title: initialData?.title || "",
      researcher_names: parseResearcherNames(initialData?.researcher_name),
      abstract: initialData?.abstract || "",
      keywords: initialData?.keywords || "",
      department: initialData?.department || "",
      year_level: initialData?.year_level || "",
      academic_year: initialData?.academic_year || "",
      semester: initialData?.semester || "",
      journal_name: initialData?.journal_name || "",
      journal_volume: initialData?.journal_volume || "",
      journal_issue: initialData?.journal_issue || "",
      doi: initialData?.doi || "",
      co_authors: initialData?.co_authors || "",
      adviser_name: initialData?.adviser_name || "",
      project_type: initialData?.project_type || "",
      capstone_category: initialData?.capstone_category || "",
      program: initialData?.program || "",
      isbn: initialData?.isbn || "",
      publisher: initialData?.publisher || "",
      publication_date: initialData?.publication_date || "",
      author: initialData?.author || "",
      edition: initialData?.edition || "",
      language: initialData?.language || "",
      category: initialData?.category || "",
      cover_photo: undefined,
      file: undefined,
    },
  });

  const documentType = form.watch("document_type");

  const onSubmit = React.useCallback(
    async (values: UploadThesisFormValues) => {
      setError(null);
      setIsSubmitting(true);

      try {
        let fileUrl = "";
        let filePath = "";
        let fileName = "";
        let fileSize = 0;
        let fileType = "";
        let coverImageUrl = initialData?.ebook_cover_image || "";

        // Upload cover photo if provided (for Ebooks)
        if (values.cover_photo && values.document_type === "Ebooks") {
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

        // Upload file if provided (required for new, optional for edit)
        if (values.file) {
          setIsUploadingFile(true);
          const formData = new FormData();
          formData.append("file", values.file);

          const uploadResponse = await fetch("/api/upload/thesis", {
            method: "POST",
            body: formData,
          });

          if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json().catch(() => ({
              message: "Failed to upload file. Please try again.",
            }));
            setError(
              errorData.message ?? "Failed to upload file. Please try again."
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
        }

        // Join researcher names with comma for storage
        const researcherNameString = values.researcher_names?.join(", ") || "";
        // For Ebooks and Journal, use author as researcher_name
        const finalResearcherName =
          values.document_type === "Ebooks"
            ? values.author || researcherNameString
            : values.document_type === "Journal"
            ? values.author ||
              values.co_authors ||
              researcherNameString ||
              "Journal Author"
            : researcherNameString;

        // Create or update thesis document
        if (isEdit && initialData?.id) {
          // Update existing thesis
          const updateData: any = {
            document_type: values.document_type,
            // Only include these fields for Thesis, Capstone, and Ebooks
            ...(values.document_type !== "Journal" && {
              title: values.title,
              researcher_name: finalResearcherName,
              abstract: values.abstract || null,
              department: values.department || null,
              year_level: values.year_level || null,
              academic_year: values.academic_year || null,
              semester: values.semester || null,
            }),
            keywords: values.keywords || null,
            journal_name:
              values.document_type === "Journal"
                ? values.journal_name || null
                : null,
            journal_volume:
              values.document_type === "Journal"
                ? values.journal_volume || null
                : null,
            journal_issue:
              values.document_type === "Journal"
                ? values.journal_issue || null
                : null,
            doi: values.document_type === "Journal" ? values.doi || null : null,
            adviser_name:
              values.document_type === "Thesis" ||
              values.document_type === "Capstone"
                ? values.adviser_name || null
                : null,
            project_type:
              values.document_type === "Capstone" ||
              values.document_type === "Thesis"
                ? values.project_type || null
                : null,
            capstone_category:
              values.document_type === "Capstone" ||
              values.document_type === "Thesis"
                ? values.capstone_category || null
                : null,
            program:
              values.document_type === "Capstone" ||
              values.document_type === "Thesis"
                ? values.program || null
                : null,
            co_authors:
              values.document_type === "Journal"
                ? values.co_authors || null
                : values.document_type === "Ebooks"
                ? JSON.stringify({
                    isbn: values.isbn || null,
                    publisher: values.publisher || null,
                    publication_date: values.publication_date || null,
                    edition: values.edition || null,
                    language: values.language || null,
                    category: values.category || null,
                  })
                : null,
          };

          const response = await fetch(
            `/api/library/thesis/${initialData.id}`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(updateData),
            }
          );

          if (!response.ok) {
            const errorBody = await response.json().catch(() => ({
              message: "Failed to update thesis document. Please try again.",
            }));
            setError(
              errorBody.message ??
                "Failed to update thesis document. Please try again."
            );
            setIsSubmitting(false);
            return;
          }

          toast.success("Thesis document updated successfully.");
        } else {
          // Create new thesis
          const response = await fetch("/api/library/thesis", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              document_type: values.document_type,
              // Only include these fields for Thesis, Capstone, and Ebooks
              ...(values.document_type !== "Journal" && {
                title: values.title,
                researcher_name: finalResearcherName,
                abstract: values.abstract || undefined,
                department: values.department || undefined,
                year_level: values.year_level || undefined,
                academic_year: values.academic_year || undefined,
                semester: values.semester || undefined,
              }),
              keywords: values.keywords || undefined,
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
              adviser_name:
                values.document_type === "Thesis" ||
                values.document_type === "Capstone"
                  ? values.adviser_name || undefined
                  : undefined,
              project_type:
                values.document_type === "Capstone" ||
                values.document_type === "Thesis"
                  ? values.project_type || undefined
                  : undefined,
              capstone_category:
                values.document_type === "Capstone" ||
                values.document_type === "Thesis"
                  ? values.capstone_category || undefined
                  : undefined,
              program:
                values.document_type === "Capstone" ||
                values.document_type === "Thesis"
                  ? values.program || undefined
                  : undefined,
              co_authors:
                values.document_type === "Journal"
                  ? values.co_authors || undefined
                  : values.document_type === "Ebooks"
                  ? JSON.stringify({
                      isbn: values.isbn || null,
                      publisher: values.publisher || null,
                      publication_date: values.publication_date || null,
                      edition: values.edition || null,
                      language: values.language || null,
                      category: values.category || null,
                    })
                  : undefined,
              // Ebook cover image
              ebook_cover_image:
                values.document_type === "Ebooks" && coverImageUrl
                  ? coverImageUrl
                  : undefined,
              file_url: fileUrl,
              file_name: fileName,
              file_size: fileSize,
              file_type: fileType,
              file_path: filePath,
            }),
          });

          if (!response.ok) {
            const errorBody = await response.json().catch(() => ({
              message: "Failed to upload thesis document. Please try again.",
            }));
            setError(
              errorBody.message ??
                "Failed to upload thesis document. Please try again."
            );
            setIsSubmitting(false);
            return;
          }

          toast.success("Thesis document uploaded successfully.");
        }

        form.reset();
        setIsSubmitting(false);
        if (onSuccess) {
          onSuccess();
        }
        router.refresh();
      } catch (cause) {
        setError("Network error while uploading. Please retry.");
        setIsSubmitting(false);
        setIsUploadingFile(false);
      }
    },
    [form, onSuccess, router, isEdit, initialData]
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Document Category Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">
              Document Category
            </h3>
          </div>

          <FormField
            control={form.control}
            name="document_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-medium">Document Type *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isSubmitting}
                >
                  <FormControl>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select document type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Thesis">Thesis</SelectItem>
                    <SelectItem value="Journal">Journal</SelectItem>
                    <SelectItem value="Capstone">Capstone</SelectItem>
                    <SelectItem value="Ebooks">Ebooks</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Select the type of document you are uploading.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />

        {/* Document Information Section - Only for Thesis and Capstone */}
        {documentType !== "Journal" && documentType !== "Ebooks" && (
          <>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-foreground">
                  Document Information
                </h3>
              </div>

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">
                      Research Title *
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter the research title"
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
                name="researcher_names"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium flex items-center gap-2">
                      <User className="h-3.5 w-3.5" />
                      Researcher Names *
                    </FormLabel>
                    <FormControl>
                      <MultiNameInput
                        value={field.value || []}
                        onChange={field.onChange}
                        placeholder="Enter researcher name and press Enter"
                        disabled={isSubmitting}
                        maxNames={10}
                      />
                    </FormControl>
                    <FormDescription>
                      Add multiple researcher names. Press Enter or click
                      outside to add each name.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="abstract"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">Abstract</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Enter thesis abstract (optional)"
                        disabled={isSubmitting}
                        rows={4}
                        className="resize-none"
                      />
                    </FormControl>
                    <FormDescription>
                      Optional. Provide a brief summary of your research.
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
                    <FormLabel className="font-medium">Keywords</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., machine learning, data analysis, research"
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
            </div>

            <Separator />

            {/* Academic Information Section - Only for Thesis and Capstone */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-foreground">
                  Academic Information
                </h3>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">Collges</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., Computer Science"
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
                  name="year_level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">Year Level</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., 4th Year"
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
                  name="academic_year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5" />
                        Academic Year
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., 2024-2025"
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
                  name="semester"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">Semester</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., 1st Semester"
                          disabled={isSubmitting}
                          className="h-11"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </>
        )}

        {/* Journal Specific Fields */}
        {documentType === "Journal" && (
          <>
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-foreground">
                  Journal Information
                </h3>
              </div>

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

              <FormField
                control={form.control}
                name="author"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium flex items-center gap-2">
                      <User className="h-3.5 w-3.5" />
                      Author *
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
                      Enter the primary author(s) of the journal article.
                      Separate multiple authors with commas.
                    </FormDescription>
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
                          placeholder="e.g., Volume 10"
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
                          placeholder="e.g., Issue 3"
                          disabled={isSubmitting}
                          className="h-11"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="doi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">
                      DOI (Digital Object Identifier)
                    </FormLabel>
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
                      <Textarea
                        {...field}
                        placeholder="Enter co-authors (separate multiple authors with commas)"
                        disabled={isSubmitting}
                        rows={3}
                        className="resize-none"
                      />
                    </FormControl>
                    <FormDescription>
                      Optional. List co-authors separated by commas.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </>
        )}

        {/* Thesis Specific Fields */}
        {documentType === "Thesis" && (
          <>
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-foreground">
                  Thesis Information
                </h3>
              </div>

              <FormField
                control={form.control}
                name="adviser_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">Adviser Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter adviser name"
                        disabled={isSubmitting}
                        className="h-11"
                      />
                    </FormControl>
                    <FormDescription>
                      Optional. Name of your thesis adviser.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="project_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">
                        Project Type
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., Software Development, Research"
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
                  name="capstone_category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">Category</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., Web Application, Mobile App"
                          disabled={isSubmitting}
                          className="h-11"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="program"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">Program</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., Computer Science, Information Technology"
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

        {/* Ebook Specific Fields */}
        {documentType === "Ebooks" && (
          <>
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-foreground">
                  Ebook Information
                </h3>
              </div>

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">Book Title *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter the book title"
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
                      <FormDescription>
                        Optional. International Standard Book Number.
                      </FormDescription>
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
                      Optional. Provide a brief description or summary of the
                      book.
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
                              // Validate file size (5MB max)
                              const maxSize = 5 * 1024 * 1024;
                              if (file.size > maxSize) {
                                toast.error(
                                  "Cover image size must be less than 5MB"
                                );
                                return;
                              }
                              // Validate file type
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
                              <p>
                                {(value.size / (1024 * 1024)).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                        )}
                        {initialData?.ebook_cover_image && !value && (
                          <div className="flex items-center gap-4">
                            <div className="relative w-32 h-48 border-2 border-dashed border-muted-foreground/25 rounded-lg overflow-hidden bg-muted/50">
                              <img
                                src={initialData.ebook_cover_image}
                                alt="Current cover"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1 text-sm text-muted-foreground">
                              <p className="font-medium">Current cover image</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormDescription>
                      Optional. Upload a cover image for the book (JPEG, PNG, or
                      WebP, max 5MB).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </>
        )}

        {/* Capstone Specific Fields */}
        {documentType === "Capstone" && (
          <>
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-foreground">
                  Capstone Information
                </h3>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="project_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">
                        Project Type
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., Software Development, Research"
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
                  name="capstone_category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">Category</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., Web Application, Mobile App"
                          disabled={isSubmitting}
                          className="h-11"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="program"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">Program</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., Computer Science, Information Technology"
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
                name="adviser_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">Adviser Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter adviser name"
                        disabled={isSubmitting}
                        className="h-11"
                      />
                    </FormControl>
                    <FormDescription>
                      Optional. Name of your capstone adviser.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </>
        )}

        <Separator />

        {/* File Upload Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Upload className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">
              Document File
            </h3>
          </div>

          <FormField
            control={form.control}
            name="file"
            render={({ field: { value, onChange, ...fieldProps } }) => (
              <FormItem>
                <FormLabel className="font-medium">Upload Document *</FormLabel>
                <FormControl>
                  <div className="space-y-2">
                    <Input
                      {...fieldProps}
                      type="file"
                      accept=".pdf,.doc,.docx,.epub,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/epub+zip"
                      disabled={isSubmitting || isUploadingFile}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) {
                          // Validate file size (50MB max)
                          const maxSize = 50 * 1024 * 1024;
                          if (file.size > maxSize) {
                            toast.error("File size must be less than 50MB");
                            return;
                          }
                          // Validate file type
                          const allowedTypes = [
                            "application/pdf",
                            "application/msword",
                            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                            "application/epub+zip",
                          ];
                          if (!allowedTypes.includes(file.type)) {
                            toast.error(
                              "Please upload a PDF, DOC/DOCX, or EPUB file"
                            );
                            return;
                          }
                          onChange(file);
                        }
                      }}
                      className="cursor-pointer h-11"
                    />
                    {value && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        <span className="truncate">{value.name}</span>
                        <span className="text-xs">
                          ({(value.size / (1024 * 1024)).toFixed(2)} MB)
                        </span>
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormDescription>
                  {isEdit
                    ? "Upload a new file to replace the existing one (optional). Accepted formats: PDF, DOC, DOCX, EPUB."
                    : "Upload PDF, DOC, DOCX, or EPUB file (max 50MB)"}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => {
              form.reset({
                document_type: "Thesis",
                title: "",
                researcher_names: [],
                abstract: "",
                keywords: "",
                department: "",
                year_level: "",
                academic_year: "",
                semester: "",
                journal_name: "",
                journal_volume: "",
                journal_issue: "",
                doi: "",
                co_authors: "",
                adviser_name: "",
                project_type: "",
                capstone_category: "",
                program: "",
                file: undefined,
              });
            }}
            disabled={isSubmitting || isUploadingFile}
          >
            Clear Form
          </Button>
          <Button
            type="submit"
            className="w-full sm:flex-1"
            disabled={isSubmitting || isUploadingFile}
            size="lg"
          >
            {isSubmitting || isUploadingFile ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isUploadingFile
                  ? "Uploading File…"
                  : isEdit
                  ? "Updating…"
                  : "Uploading…"}
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                {isEdit ? "Update Thesis Document" : "Upload Thesis Document"}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
