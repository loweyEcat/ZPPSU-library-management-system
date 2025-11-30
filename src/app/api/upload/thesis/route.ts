import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { requireStudent } from "@/lib/auth-library";
import { sanitizeInput } from "@/lib/sanitize";

const getBlobToken = (): string => {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error("BLOB_READ_WRITE_TOKEN environment variable is required");
  }
  return token;
};

const normalizeFilename = (filename: string): string => {
  return sanitizeInput(filename)
    .replace(/[^a-zA-Z0-9_.-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 160);
};

const generateUniqueFilename = (originalFilename: string, studentId: number): string => {
  const sanitized = normalizeFilename(originalFilename || "thesis-document");
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 9);
  const extension = sanitized.includes(".") ? sanitized.substring(sanitized.lastIndexOf(".")) : "";
  const baseName = sanitized.includes(".") ? sanitized.substring(0, sanitized.lastIndexOf(".")) : sanitized;
  return `thesis/${studentId}/${baseName}-${timestamp}-${randomSuffix}${extension}`;
};

export async function POST(request: Request) {
  try {
    const session = await requireStudent();

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { message: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file size (max 50MB for thesis documents)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { message: "File size must be less than 50MB" },
        { status: 400 }
      );
    }

    // Validate file type (PDF and DOC/DOCX only)
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { message: "File type not allowed. Please upload a PDF or DOC/DOCX file." },
        { status: 400 }
      );
    }

    const originalBuffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type || "application/pdf";

    const fileName = generateUniqueFilename(file.name, session.user.id);

    const blob = await put(fileName, originalBuffer, {
      access: "public",
      token: getBlobToken(),
      contentType: mimeType,
      addRandomSuffix: false,
    });

    return NextResponse.json(
      {
        url: blob.url,
        pathname: blob.pathname,
        contentType: mimeType,
        size: originalBuffer.length,
        fileName: file.name,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Thesis file upload error:", error);
    return NextResponse.json(
      { message: "Failed to upload file. Please try again." },
      { status: 500 }
    );
  }
}

