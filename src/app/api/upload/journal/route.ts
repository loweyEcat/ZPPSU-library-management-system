import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { requireAdminOrSuperAdmin } from "@/lib/auth-library";
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

const generateUniqueFilename = (originalFilename: string, userId: number): string => {
  const sanitized = normalizeFilename(originalFilename || "journal");
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 9);
  const extension = sanitized.includes(".") 
    ? sanitized.substring(sanitized.lastIndexOf(".")) 
    : originalFilename.toLowerCase().endsWith(".pdf") ? ".pdf" : ".epub";
  const baseName = sanitized.includes(".") 
    ? sanitized.substring(0, sanitized.lastIndexOf(".")) 
    : sanitized;
  return `journals/${userId}/${baseName}-${timestamp}-${randomSuffix}${extension}`;
};

export async function POST(request: Request) {
  try {
    const session = await requireAdminOrSuperAdmin();

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { message: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file size (max 50MB for journals)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { message: "File size must be less than 50MB" },
        { status: 400 }
      );
    }

    // Validate file type - PDF or EPUB
    const isPDF = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    const isEPUB = file.type === "application/epub+zip" || file.name.toLowerCase().endsWith(".epub");
    
    if (!isPDF && !isEPUB) {
      return NextResponse.json(
        { message: "Journals only accept PDF or EPUB format files. Please upload a PDF or EPUB file." },
        { status: 400 }
      );
    }

    const originalBuffer = Buffer.from(await file.arrayBuffer());
    const mimeType = isPDF ? "application/pdf" : "application/epub+zip";

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
    console.error("Journal upload error:", error);
    return NextResponse.json(
      { message: "Failed to upload journal file. Please try again." },
      { status: 500 }
    );
  }
}

