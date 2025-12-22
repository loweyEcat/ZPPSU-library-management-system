import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/auth-library";
import { sanitizeInput } from "@/lib/sanitize";

const createThesisSchema = z.object({
  document_type: z.enum(["Thesis", "Journal", "Capstone", "Ebooks"]),
  title: z.string().max(255, "Title must not exceed 255 characters").optional(),
  researcher_name: z
    .string()
    .max(500, "Total researcher names must not exceed 500 characters")
    .refine(
      (val) => {
        if (!val) return true; // Optional for Journal
        // Ensure at least one name exists after splitting
        const names = val
          .split(",")
          .map((n) => n.trim())
          .filter((n) => n.length > 0);
        return names.length > 0;
      },
      { message: "At least one researcher name is required" }
    )
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
  file_url: z.string().url("Invalid file URL"),
  file_name: z.string().min(1, "File name is required"),
  file_size: z.number().int().positive("File size must be positive"),
  file_type: z.string().min(1, "File type is required"),
  file_path: z.string().min(1, "File path is required"),
  ebook_cover_image: z
    .string()
    .url("Invalid cover image URL")
    .optional()
    .nullable(),
});

export async function POST(request: Request) {
  try {
    const session = await requireStudent();

    const body = await request.json().catch(() => null);
    const validation = createThesisSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          message: "Invalid thesis data.",
          issues: validation.error.flatten(),
        },
        { status: 422 }
      );
    }

    const data = validation.data;

    // Validate required fields based on document type
    if (data.document_type !== "Journal" && data.document_type !== "Ebooks") {
      if (!data.title || data.title.trim().length === 0) {
        return NextResponse.json(
          { message: "Title is required for Thesis and Capstone documents." },
          { status: 422 }
        );
      }
      if (!data.researcher_name || data.researcher_name.trim().length === 0) {
        return NextResponse.json(
          {
            message:
              "Researcher name is required for Thesis and Capstone documents.",
          },
          { status: 422 }
        );
      }
    }

    // For Journal, use journal_name as title if title is not provided
    const finalTitle =
      data.document_type === "Journal"
        ? data.title || data.journal_name || "Journal Article"
        : data.document_type === "Ebooks"
        ? data.title || "Ebook"
        : data.title;

    // For Journal, use co_authors as researcher_name if researcher_name is not provided
    // For Ebooks, researcher_name should come from the form (author field)
    const finalResearcherName =
      data.document_type === "Journal"
        ? data.researcher_name || data.co_authors || "Journal Author"
        : data.researcher_name;

    // Get student information
    const student = await prisma.lib_users.findUnique({
      where: { id: session.user.id },
      select: {
        department: true,
        year_level: true,
      },
    });

    const thesis = await prisma.lib_thesis_documents.create({
      data: {
        student_id: session.user.id,
        document_type: data.document_type,
        title: sanitizeInput(finalTitle as string),
        researcher_name: sanitizeInput(finalResearcherName as string),
        abstract: data.abstract ? sanitizeInput(data.abstract) : null,
        keywords: data.keywords ? sanitizeInput(data.keywords) : null,
        department: data.department
          ? sanitizeInput(data.department)
          : student?.department || null,
        year_level: data.year_level
          ? sanitizeInput(data.year_level)
          : student?.year_level || null,
        academic_year: data.academic_year
          ? sanitizeInput(data.academic_year)
          : null,
        semester: data.semester ? sanitizeInput(data.semester) : null,
        journal_name: data.journal_name
          ? sanitizeInput(data.journal_name)
          : null,
        journal_volume: data.journal_volume
          ? sanitizeInput(data.journal_volume)
          : null,
        journal_issue: data.journal_issue
          ? sanitizeInput(data.journal_issue)
          : null,
        doi: data.doi ? sanitizeInput(data.doi) : null,
        co_authors: data.co_authors ? sanitizeInput(data.co_authors) : null,
        adviser_name: data.adviser_name
          ? sanitizeInput(data.adviser_name)
          : null,
        team_members: data.team_members
          ? sanitizeInput(data.team_members)
          : null,
        project_type: data.project_type
          ? sanitizeInput(data.project_type)
          : null,
        capstone_category: data.capstone_category
          ? sanitizeInput(data.capstone_category)
          : null,
        program: data.program ? sanitizeInput(data.program) : null,
        ebook_cover_image: data.ebook_cover_image || null,
        file_url: data.file_url,
        file_name: sanitizeInput(data.file_name),
        file_size: data.file_size,
        file_type: data.file_type,
        file_path: data.file_path,
        status: "Pending",
        submission_status: "Under_Review",
      },
      select: {
        id: true,
        title: true,
        researcher_name: true,
        academic_year: true,
        semester: true,
        file_url: true,
        file_name: true,
        status: true,
        submission_status: true,
        submitted_at: true,
      },
    });

    return NextResponse.json(
      {
        message: "Thesis document uploaded successfully.",
        thesis: {
          ...thesis,
          submitted_at: thesis.submitted_at.toISOString(),
        },
      },
      {
        status: 201,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Failed to create thesis:", error);
    return NextResponse.json(
      {
        message: "Failed to upload thesis document. Please try again.",
      },
      { status: 500 }
    );
  }
}
