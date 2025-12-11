import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminOrSuperAdmin } from "@/lib/auth-library";
import { sanitizeInput } from "@/lib/sanitize";

const createEbookSchema = z.object({
  document_type: z.enum(["Ebooks", "Journal"]),
  title: z.string().min(1, "Title is required").max(255, "Title must not exceed 255 characters"),
  researcher_name: z.string().min(1, "Author is required").max(500, "Author must not exceed 500 characters"),
  abstract: z.string().optional().nullable(),
  keywords: z.string().max(500, "Keywords must not exceed 500 characters").optional().nullable(),
  co_authors: z.string().optional().nullable(),
  journal_name: z.string().max(255, "Journal name must not exceed 255 characters").optional().nullable(),
  journal_volume: z.string().max(50, "Journal volume must not exceed 50 characters").optional().nullable(),
  journal_issue: z.string().max(50, "Journal issue must not exceed 50 characters").optional().nullable(),
  doi: z.string().max(100, "DOI must not exceed 100 characters").optional().nullable(),
  ebook_cover_image: z.string().url("Invalid cover image URL").optional().nullable(),
  file_url: z.string().url("Invalid file URL"),
  file_name: z.string().min(1, "File name is required"),
  file_size: z.number().int().positive("File size must be positive"),
  file_type: z.string().min(1, "File type is required"),
  file_path: z.string().min(1, "File path is required"),
});

export async function POST(request: Request) {
  try {
    const session = await requireAdminOrSuperAdmin();
    const body = await request.json().catch(() => null);
    const validation = createEbookSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          message: "Invalid ebook data.",
          issues: validation.error.flatten(),
        },
        { status: 422 }
      );
    }

    const data = validation.data;

    // Create document (ebook or journal) - automatically approved and published for admin uploads
    const document = await prisma.lib_thesis_documents.create({
      data: {
        student_id: session.user.id, // Admin's ID as uploader
        document_type: data.document_type,
        title: sanitizeInput(data.title),
        researcher_name: sanitizeInput(data.researcher_name),
        abstract: data.abstract ? sanitizeInput(data.abstract) : null,
        keywords: data.keywords ? sanitizeInput(data.keywords) : null,
        co_authors: data.co_authors || null,
        journal_name: data.journal_name ? sanitizeInput(data.journal_name) : null,
        journal_volume: data.journal_volume ? sanitizeInput(data.journal_volume) : null,
        journal_issue: data.journal_issue ? sanitizeInput(data.journal_issue) : null,
        doi: data.doi ? sanitizeInput(data.doi) : null,
        ebook_cover_image: data.ebook_cover_image || null,
        file_url: data.file_url,
        file_name: sanitizeInput(data.file_name),
        file_size: data.file_size,
        file_type: data.file_type,
        file_path: data.file_path,
        status: "Approved",
        submission_status: "Published",
        approved_at: new Date(),
        published_at: new Date(),
      },
      select: {
        id: true,
        title: true,
        researcher_name: true,
        file_url: true,
        file_name: true,
        file_type: true,
        status: true,
        submission_status: true,
        published_at: true,
      },
    });

    return NextResponse.json(
      {
        message: `${data.document_type === "Ebooks" ? "Ebook" : "Journal"} uploaded and published successfully.`,
        document: {
          ...document,
          published_at: document.published_at?.toISOString() || null,
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
    console.error("Failed to create ebook:", error);
    return NextResponse.json(
      {
        message: "Failed to upload ebook document. Please try again.",
      },
      { status: 500 }
    );
  }
}

