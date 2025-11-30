import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireStaffOrAbove } from "@/lib/auth-library";
import { sanitizeInput } from "@/lib/sanitize";

const reviewThesisSchema = z.object({
  action: z.enum(["approve", "reject", "request_revision"]),
  review_notes: z.string().optional().nullable(),
  rejection_reason: z.string().optional().nullable(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await requireStaffOrAbove();
    const resolvedParams = await Promise.resolve(params);
    const thesisId = parseInt(resolvedParams.id);

    if (isNaN(thesisId)) {
      return NextResponse.json(
        { message: "Invalid thesis ID." },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => null);
    const validation = reviewThesisSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          message: "Invalid review data.",
          issues: validation.error.flatten(),
        },
        { status: 422 }
      );
    }

    const { action, review_notes, rejection_reason } = validation.data;

    // Check if thesis exists
    const existingThesis = await prisma.lib_thesis_documents.findUnique({
      where: { id: thesisId },
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

    const updateData: any = {
      reviewed_by_staff_id: session.user.id,
      staff_reviewed_at: new Date(),
    };

    if (action === "approve") {
      updateData.submission_status = "Staff_Approved";
      updateData.status = "Under_Review";
      if (review_notes) {
        updateData.staff_review_notes = sanitizeInput(review_notes);
      }
    } else if (action === "reject") {
      updateData.submission_status = "Staff_Rejected";
      updateData.status = "Rejected";
      if (rejection_reason) {
        updateData.rejection_reason = sanitizeInput(rejection_reason);
      }
      if (review_notes) {
        updateData.staff_review_notes = sanitizeInput(review_notes);
      }
    } else if (action === "request_revision") {
      updateData.submission_status = "Revision_Requested";
      updateData.status = "Revision_Required";
      if (review_notes) {
        updateData.staff_review_notes = sanitizeInput(review_notes);
      }
    }

    const updatedThesis = await prisma.lib_thesis_documents.update({
      where: { id: thesisId },
      data: updateData,
      select: {
        id: true,
        title: true,
        status: true,
        submission_status: true,
        staff_reviewed_at: true,
      },
    });

    return NextResponse.json(
      {
        message: `Thesis document ${action === "approve" ? "approved" : action === "reject" ? "rejected" : "marked for revision"} successfully.`,
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
    console.error("Failed to review thesis:", error);
    return NextResponse.json(
      {
        message: "Failed to review thesis document. Please try again.",
      },
      { status: 500 }
    );
  }
}

