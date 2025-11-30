import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/auth-library";
import { sanitizeInput } from "@/lib/sanitize";

const createThesisSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title must not exceed 255 characters"),
  researcher_name: z.string().min(1, "At least one researcher name is required").max(500, "Total researcher names must not exceed 500 characters").refine(
    (val) => {
      // Ensure at least one name exists after splitting
      const names = val.split(",").map((n) => n.trim()).filter((n) => n.length > 0);
      return names.length > 0;
    },
    { message: "At least one researcher name is required" }
  ),
  abstract: z.string().optional(),
  keywords: z.string().max(500, "Keywords must not exceed 500 characters").optional(),
  department: z.string().max(100, "Department must not exceed 100 characters").optional(),
  year_level: z.string().max(50, "Year level must not exceed 50 characters").optional(),
  academic_year: z.string().max(20, "Academic year must not exceed 20 characters").optional(),
  semester: z.string().max(20, "Semester must not exceed 20 characters").optional(),
  file_url: z.string().url("Invalid file URL"),
  file_name: z.string().min(1, "File name is required"),
  file_size: z.number().int().positive("File size must be positive"),
  file_type: z.string().min(1, "File type is required"),
  file_path: z.string().min(1, "File path is required"),
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
        title: sanitizeInput(data.title),
        researcher_name: sanitizeInput(data.researcher_name),
        abstract: data.abstract ? sanitizeInput(data.abstract) : null,
        keywords: data.keywords ? sanitizeInput(data.keywords) : null,
        department: data.department ? sanitizeInput(data.department) : student?.department || null,
        year_level: data.year_level ? sanitizeInput(data.year_level) : student?.year_level || null,
        academic_year: data.academic_year ? sanitizeInput(data.academic_year) : null,
        semester: data.semester ? sanitizeInput(data.semester) : null,
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

