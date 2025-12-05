import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireStudent, requireStaffOrAbove } from "@/lib/auth-library";
import { sanitizeInput } from "@/lib/sanitize";

const updateThesisSchema = z.object({
  document_type: z.enum(["Thesis", "Journal", "Capstone"]).optional(),
  title: z.string().min(1, "Title is required").max(255, "Title must not exceed 255 characters").optional(),
  researcher_name: z.string().min(1, "At least one researcher name is required").max(500, "Total researcher names must not exceed 500 characters").refine(
    (val) => {
      if (!val) return true; // Optional field
      const names = val.split(",").map((n) => n.trim()).filter((n) => n.length > 0);
      return names.length > 0;
    },
    { message: "At least one researcher name is required" }
  ).optional(),
  abstract: z.string().optional().nullable(),
  keywords: z.string().max(500, "Keywords must not exceed 500 characters").optional().nullable(),
  department: z.string().max(100, "Department must not exceed 100 characters").optional().nullable(),
  year_level: z.string().max(50, "Year level must not exceed 50 characters").optional().nullable(),
  academic_year: z.string().max(20, "Academic year must not exceed 20 characters").optional().nullable(),
  semester: z.string().max(20, "Semester must not exceed 20 characters").optional().nullable(),
  // Journal fields
  journal_name: z.string().max(255, "Journal name must not exceed 255 characters").optional().nullable(),
  journal_volume: z.string().max(50, "Journal volume must not exceed 50 characters").optional().nullable(),
  journal_issue: z.string().max(50, "Journal issue must not exceed 50 characters").optional().nullable(),
  doi: z.string().max(100, "DOI must not exceed 100 characters").optional().nullable(),
  co_authors: z.string().optional().nullable(),
  // Thesis fields
  adviser_name: z.string().max(255, "Adviser name must not exceed 255 characters").optional().nullable(),
  // Capstone fields
  team_members: z.string().optional().nullable(),
  project_type: z.string().max(100, "Project type must not exceed 100 characters").optional().nullable(),
  capstone_category: z.string().max(50, "Capstone category must not exceed 50 characters").optional().nullable(),
  program: z.string().max(100, "Program must not exceed 100 characters").optional().nullable(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Try to get session - allow student, staff, or admin
    let session;
    try {
      session = await requireStudent();
    } catch {
      try {
        session = await requireStaffOrAbove();
      } catch {
        return NextResponse.json(
          { message: "Unauthorized." },
          { status: 401 }
        );
      }
    }

    const resolvedParams = await Promise.resolve(params);
    const thesisId = parseInt(resolvedParams.id);

    if (isNaN(thesisId)) {
      return NextResponse.json(
        { message: "Invalid thesis ID." },
        { status: 400 }
      );
    }

    // Build where clause - students can only see their own, staff/admin can see all
    const whereClause: any = { id: thesisId };
    if (session.user.userRole === "Student") {
      whereClause.student_id = session.user.id;
    }

    const thesis = await prisma.lib_thesis_documents.findFirst({
      where: whereClause,
      select: {
        id: true,
        title: true,
        researcher_name: true,
        abstract: true,
        keywords: true,
        department: true,
        year_level: true,
        academic_year: true,
        semester: true,
        file_url: true,
        file_name: true,
        file_size: true,
        file_type: true,
        status: true,
        submission_status: true,
        submitted_at: true,
        staff_reviewed_at: true,
        admin_reviewed_at: true,
        approved_at: true,
        staff_review_notes: true,
        admin_review_notes: true,
        rejection_reason: true,
        document_type: true,
        journal_name: true,
        journal_volume: true,
        journal_issue: true,
        doi: true,
        co_authors: true,
        adviser_name: true,
        team_members: true,
        project_type: true,
        capstone_category: true,
        program: true,
      },
    });

    if (!thesis) {
      return NextResponse.json(
        { message: "Thesis document not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...thesis,
      submitted_at: thesis.submitted_at.toISOString(),
      staff_reviewed_at: thesis.staff_reviewed_at?.toISOString() || null,
      admin_reviewed_at: thesis.admin_reviewed_at?.toISOString() || null,
      approved_at: thesis.approved_at?.toISOString() || null,
    });
  } catch (error) {
    console.error("Failed to get thesis:", error);
    return NextResponse.json(
      { message: "Failed to retrieve thesis document." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await requireStudent();
    const resolvedParams = await Promise.resolve(params);
    const thesisId = parseInt(resolvedParams.id);

    if (isNaN(thesisId)) {
      return NextResponse.json(
        { message: "Invalid thesis ID." },
        { status: 400 }
      );
    }

    // Check if thesis exists and belongs to student
    const existingThesis = await prisma.lib_thesis_documents.findFirst({
      where: {
        id: thesisId,
        student_id: session.user.id,
      },
      select: {
        id: true,
        status: true,
        submission_status: true,
      },
    });

    if (!existingThesis) {
      return NextResponse.json(
        { message: "Thesis document not found." },
        { status: 404 }
      );
    }

    // Only allow editing if status is Pending, Rejected, or Revision_Required
    if (
      existingThesis.status !== "Pending" &&
      existingThesis.status !== "Rejected" &&
      existingThesis.status !== "Revision_Required"
    ) {
      return NextResponse.json(
        { message: "Cannot edit thesis document in current status." },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => null);
    const validation = updateThesisSchema.safeParse(body);

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
    const updateData: any = {};

    if (data.document_type !== undefined) updateData.document_type = data.document_type;
    if (data.title !== undefined) updateData.title = sanitizeInput(data.title);
    if (data.researcher_name !== undefined) updateData.researcher_name = sanitizeInput(data.researcher_name);
    if (data.abstract !== undefined) updateData.abstract = data.abstract ? sanitizeInput(data.abstract) : null;
    if (data.keywords !== undefined) updateData.keywords = data.keywords ? sanitizeInput(data.keywords) : null;
    if (data.department !== undefined) updateData.department = data.department ? sanitizeInput(data.department) : null;
    if (data.year_level !== undefined) updateData.year_level = data.year_level ? sanitizeInput(data.year_level) : null;
    if (data.academic_year !== undefined) updateData.academic_year = data.academic_year ? sanitizeInput(data.academic_year) : null;
    if (data.semester !== undefined) updateData.semester = data.semester ? sanitizeInput(data.semester) : null;
    if (data.journal_name !== undefined) updateData.journal_name = data.journal_name ? sanitizeInput(data.journal_name) : null;
    if (data.journal_volume !== undefined) updateData.journal_volume = data.journal_volume ? sanitizeInput(data.journal_volume) : null;
    if (data.journal_issue !== undefined) updateData.journal_issue = data.journal_issue ? sanitizeInput(data.journal_issue) : null;
    if (data.doi !== undefined) updateData.doi = data.doi ? sanitizeInput(data.doi) : null;
    if (data.co_authors !== undefined) updateData.co_authors = data.co_authors ? sanitizeInput(data.co_authors) : null;
    if (data.adviser_name !== undefined) updateData.adviser_name = data.adviser_name ? sanitizeInput(data.adviser_name) : null;
    if (data.team_members !== undefined) updateData.team_members = data.team_members ? sanitizeInput(data.team_members) : null;
    if (data.project_type !== undefined) updateData.project_type = data.project_type ? sanitizeInput(data.project_type) : null;
    if (data.capstone_category !== undefined) updateData.capstone_category = data.capstone_category ? sanitizeInput(data.capstone_category) : null;
    if (data.program !== undefined) updateData.program = data.program ? sanitizeInput(data.program) : null;

    // Reset status if it was rejected or revision required
    if (existingThesis.status === "Rejected" || existingThesis.status === "Revision_Required") {
      updateData.status = "Pending";
      updateData.submission_status = "Under_Review";
    }

    const updatedThesis = await prisma.lib_thesis_documents.update({
      where: { id: thesisId },
      data: updateData,
      select: {
        id: true,
        title: true,
        researcher_name: true,
        academic_year: true,
        semester: true,
        status: true,
        submission_status: true,
      },
    });

    return NextResponse.json(
      {
        message: "Thesis document updated successfully.",
        thesis: updatedThesis,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Failed to update thesis:", error);
    return NextResponse.json(
      {
        message: "Failed to update thesis document. Please try again.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await requireStudent();
    const resolvedParams = await Promise.resolve(params);
    const thesisId = parseInt(resolvedParams.id);

    if (isNaN(thesisId)) {
      return NextResponse.json(
        { message: "Invalid thesis ID." },
        { status: 400 }
      );
    }

    // Check if thesis exists and belongs to student
    const existingThesis = await prisma.lib_thesis_documents.findFirst({
      where: {
        id: thesisId,
        student_id: session.user.id,
      },
      select: {
        id: true,
        status: true,
        submission_status: true,
      },
    });

    if (!existingThesis) {
      return NextResponse.json(
        { message: "Thesis document not found." },
        { status: 404 }
      );
    }

    // Only allow deletion if status is Pending or Rejected
    if (existingThesis.status !== "Pending" && existingThesis.status !== "Rejected") {
      return NextResponse.json(
        { message: "Cannot delete thesis document in current status." },
        { status: 403 }
      );
    }

    await prisma.lib_thesis_documents.delete({
      where: { id: thesisId },
    });

    return NextResponse.json(
      {
        message: "Thesis document deleted successfully.",
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Failed to delete thesis:", error);
    return NextResponse.json(
      {
        message: "Failed to delete thesis document. Please try again.",
      },
      { status: 500 }
    );
  }
}

