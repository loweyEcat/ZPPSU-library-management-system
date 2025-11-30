import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminOrSuperAdmin } from "@/lib/auth-library";
import { sanitizeInput } from "@/lib/sanitize";

const adminReviewThesisSchema = z.object({
  action: z.enum(["approve", "reject", "publish"]),
  review_notes: z.string().optional().nullable(),
  rejection_reason: z.string().optional().nullable(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await requireAdminOrSuperAdmin();
    const resolvedParams = await Promise.resolve(params);
    const thesisId = parseInt(resolvedParams.id);

    if (isNaN(thesisId)) {
      return NextResponse.json(
        { message: "Invalid thesis ID." },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => null);
    const validation = adminReviewThesisSchema.safeParse(body);

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
      reviewed_by_admin_id: session.user.id,
      admin_reviewed_at: new Date(),
    };

    if (action === "approve") {
      updateData.submission_status = "Super_Admin_Approved";
      updateData.status = "Approved";
      updateData.approved_at = new Date();
      if (review_notes) {
        updateData.admin_review_notes = sanitizeInput(review_notes);
      }
    } else if (action === "reject") {
      updateData.submission_status = "Super_Admin_Rejected";
      updateData.status = "Rejected";
      if (rejection_reason) {
        updateData.rejection_reason = sanitizeInput(rejection_reason);
      }
      if (review_notes) {
        updateData.admin_review_notes = sanitizeInput(review_notes);
      }
    } else if (action === "publish") {
      // Can only publish if already approved
      if (existingThesis.submission_status !== "Super_Admin_Approved") {
        return NextResponse.json(
          { message: "Can only publish approved documents." },
          { status: 400 }
        );
      }
      updateData.submission_status = "Published";
      updateData.published_at = new Date();
      if (review_notes) {
        updateData.admin_review_notes = sanitizeInput(review_notes);
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
        admin_reviewed_at: true,
        approved_at: true,
        published_at: true,
      },
    });

    return NextResponse.json(
      {
        message: `Thesis document ${action === "approve" ? "approved" : action === "reject" ? "rejected" : "published"} successfully.`,
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

