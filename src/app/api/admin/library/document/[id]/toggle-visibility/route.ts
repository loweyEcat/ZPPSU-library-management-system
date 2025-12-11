import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminOrSuperAdmin } from "@/lib/auth-library";

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
        is_hidden: true,
      },
    });

    if (!existingDocument) {
      return NextResponse.json(
        { message: "Document not found." },
        { status: 404 }
      );
    }

    // Toggle visibility
    const updated = await prisma.lib_thesis_documents.update({
      where: { id: documentId },
      data: {
        is_hidden: !existingDocument.is_hidden,
      },
      select: {
        id: true,
        is_hidden: true,
      },
    });

    return NextResponse.json(
      {
        message: updated.is_hidden
          ? "Document hidden successfully."
          : "Document made visible successfully.",
        is_hidden: updated.is_hidden,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Failed to toggle document visibility:", error);
    return NextResponse.json(
      {
        message: "Failed to toggle document visibility. Please try again.",
      },
      { status: 500 }
    );
  }
}

