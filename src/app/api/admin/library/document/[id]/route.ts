import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminOrSuperAdmin } from "@/lib/auth-library";
import { sanitizeInput } from "@/lib/sanitize";

const updateDocumentSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title must not exceed 255 characters"),
  researcher_name: z.string().min(1, "Author is required").max(500, "Author must not exceed 500 characters"),
  abstract: z.string().optional().nullable(),
  keywords: z.string().max(500, "Keywords must not exceed 500 characters").optional().nullable(),
  // Ebook fields (stored in co_authors as JSON)
  co_authors: z.string().optional().nullable(),
  // Journal fields
  journal_name: z.string().max(255, "Journal name must not exceed 255 characters").optional().nullable(),
  journal_volume: z.string().max(50, "Journal volume must not exceed 50 characters").optional().nullable(),
  journal_issue: z.string().max(50, "Journal issue must not exceed 50 characters").optional().nullable(),
  doi: z.string().max(100, "DOI must not exceed 100 characters").optional().nullable(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await requireAdminOrSuperAdmin();
    const resolvedParams = await Promise.resolve(params);
    const documentId = parseInt(resolvedParams.id);

    if (isNaN(documentId)) {
      return NextResponse.json(
        { message: "Invalid document ID." },
        { status: 400 }
      );
    }

    // Check if document exists
    const existingDocument = await prisma.lib_thesis_documents.findUnique({
      where: { id: documentId },
      select: {
        id: true,
        document_type: true,
      },
    });

    if (!existingDocument) {
      return NextResponse.json(
        { message: "Document not found." },
        { status: 404 }
      );
    }

    // Only allow editing of Journal and Ebooks
    if (
      existingDocument.document_type !== "Journal" &&
      existingDocument.document_type !== "Ebooks"
    ) {
      return NextResponse.json(
        { message: "Only Journal and Ebooks documents can be edited." },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => null);
    const validation = updateDocumentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          message: "Invalid document data.",
          issues: validation.error.flatten(),
        },
        { status: 422 }
      );
    }

    const data = validation.data;

    const updateData: any = {
      title: sanitizeInput(data.title),
      researcher_name: sanitizeInput(data.researcher_name),
      abstract: data.abstract ? sanitizeInput(data.abstract) : null,
      keywords: data.keywords ? sanitizeInput(data.keywords) : null,
    };

    if (existingDocument.document_type === "Ebooks") {
      // For ebooks, co_authors contains JSON metadata
      updateData.co_authors = data.co_authors || null;
    } else if (existingDocument.document_type === "Journal") {
      updateData.journal_name = data.journal_name ? sanitizeInput(data.journal_name) : null;
      updateData.journal_volume = data.journal_volume ? sanitizeInput(data.journal_volume) : null;
      updateData.journal_issue = data.journal_issue ? sanitizeInput(data.journal_issue) : null;
      updateData.doi = data.doi ? sanitizeInput(data.doi) : null;
      updateData.co_authors = data.co_authors ? sanitizeInput(data.co_authors) : null;
    }

    const updated = await prisma.lib_thesis_documents.update({
      where: { id: documentId },
      data: updateData,
      select: {
        id: true,
        title: true,
        researcher_name: true,
        document_type: true,
      },
    });

    return NextResponse.json(
      {
        message: "Document updated successfully.",
        document: updated,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Failed to update document:", error);
    return NextResponse.json(
      {
        message: "Failed to update document. Please try again.",
      },
      { status: 500 }
    );
  }
}

