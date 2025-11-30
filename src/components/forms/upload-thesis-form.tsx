"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Upload, FileText, User, BookOpen, Calendar, GraduationCap } from "lucide-react";
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

const createUploadThesisSchema = (isEdit: boolean) => z.object({
  title: z.string().min(1, "Title is required").max(255, "Title must not exceed 255 characters"),
  researcher_names: z.array(z.string().min(1, "Researcher name cannot be empty")).min(1, "At least one researcher name is required"),
  abstract: z.string().optional(),
  keywords: z.string().max(500, "Keywords must not exceed 500 characters").optional(),
  department: z.string().max(100, "Department must not exceed 100 characters").optional(),
  year_level: z.string().max(50, "Year level must not exceed 50 characters").optional(),
  academic_year: z.string().max(20, "Academic year must not exceed 20 characters").optional(),
  semester: z.string().max(20, "Semester must not exceed 20 characters").optional(),
  file: isEdit
    ? z.instanceof(File, { message: "Please select a file to upload" }).optional()
    : z.instanceof(File, { message: "Please select a file to upload" }),
});

type UploadThesisFormValues = z.infer<ReturnType<typeof createUploadThesisSchema>>;

interface UploadThesisFormProps {
  onSuccess?: () => void;
  initialData?: {
    id: number;
    title: string;
    researcher_name: string;
    abstract?: string | null;
    keywords?: string | null;
    department?: string | null;
    year_level?: string | null;
    academic_year?: string | null;
    semester?: string | null;
  };
  isEdit?: boolean;
}

export function UploadThesisForm({ onSuccess, initialData, isEdit = false }: UploadThesisFormProps) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isUploadingFile, setIsUploadingFile] = React.useState(false);

  const uploadThesisSchema = React.useMemo(() => createUploadThesisSchema(isEdit), [isEdit]);

  // Parse researcher_name from initialData (comma-separated string) to array
  const parseResearcherNames = (names: string | undefined): string[] => {
    if (!names) return [];
    return names.split(",").map((name) => name.trim()).filter((name) => name.length > 0);
  };

  const form = useForm<UploadThesisFormValues>({
    resolver: zodResolver(uploadThesisSchema),
    defaultValues: {
      title: initialData?.title || "",
      researcher_names: parseResearcherNames(initialData?.researcher_name),
      abstract: initialData?.abstract || "",
      keywords: initialData?.keywords || "",
      department: initialData?.department || "",
      year_level: initialData?.year_level || "",
      academic_year: initialData?.academic_year || "",
      semester: initialData?.semester || "",
      file: undefined,
    },
  });

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
            setError(errorData.message ?? "Failed to upload file. Please try again.");
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
        const researcherNameString = values.researcher_names.join(", ");

        // Create or update thesis document
        if (isEdit && initialData?.id) {
          // Update existing thesis
          const updateData: any = {
            title: values.title,
            researcher_name: researcherNameString,
            abstract: values.abstract || null,
            keywords: values.keywords || null,
            department: values.department || null,
            year_level: values.year_level || null,
            academic_year: values.academic_year || null,
            semester: values.semester || null,
          };

          const response = await fetch(`/api/library/thesis/${initialData.id}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(updateData),
          });

          if (!response.ok) {
            const errorBody = await response.json().catch(() => ({
              message: "Failed to update thesis document. Please try again.",
            }));
            setError(errorBody.message ?? "Failed to update thesis document. Please try again.");
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
              title: values.title,
              researcher_name: researcherNameString,
              abstract: values.abstract || undefined,
              keywords: values.keywords || undefined,
              department: values.department || undefined,
              year_level: values.year_level || undefined,
              academic_year: values.academic_year || undefined,
              semester: values.semester || undefined,
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
            setError(errorBody.message ?? "Failed to upload thesis document. Please try again.");
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
        {/* Document Information Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Document Information</h3>
          </div>

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-medium">Research Title *</FormLabel>
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
                  Add multiple researcher names. Press Enter or click outside to add each name.
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

        {/* Academic Information Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Academic Information</h3>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium">Department</FormLabel>
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

        <Separator />

        {/* File Upload Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Upload className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Document File</h3>
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
                      accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
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
                          ];
                          if (!allowedTypes.includes(file.type)) {
                            toast.error("Please upload a PDF or DOC/DOCX file");
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
                  {isEdit ? "Upload a new file to replace the existing one (optional)" : "Upload PDF or DOC/DOCX file (max 50MB)"}
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
                title: "",
                researcher_names: [],
                abstract: "",
                keywords: "",
                department: "",
                year_level: "",
                academic_year: "",
                semester: "",
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
                {isUploadingFile ? "Uploading File…" : isEdit ? "Updating…" : "Uploading…"}
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

