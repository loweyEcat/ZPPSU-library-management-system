import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { compressImageLossless } from "@/lib/image-compression";
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

const generateUniqueFilename = (originalFilename: string): string => {
  const sanitized = normalizeFilename(originalFilename || "school-id");
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 9);
  const extension = sanitized.includes(".") ? sanitized.substring(sanitized.lastIndexOf(".")) : "";
  const baseName = sanitized.includes(".") ? sanitized.substring(0, sanitized.lastIndexOf(".")) : sanitized;
  return `school_ids/${baseName}-${timestamp}-${randomSuffix}${extension}`;
};

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { message: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { message: "File size must be less than 10MB" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { message: "File type not allowed. Please upload an image or PDF." },
        { status: 400 }
      );
    }

    const originalBuffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type || "application/octet-stream";

    let bufferToUpload = originalBuffer;
    let finalMimeType = mimeType;

    // Compress if it's an image
    if (mimeType.startsWith("image/")) {
      const { buffer: compressedBuffer, mimeType: compressedMimeType } =
        await compressImageLossless(originalBuffer, mimeType);
      
      if (compressedBuffer.length < originalBuffer.length) {
        bufferToUpload = compressedBuffer;
        finalMimeType = compressedMimeType;
      }
    }

    const fileName = generateUniqueFilename(file.name);

    const blob = await put(fileName, bufferToUpload, {
      access: "public",
      token: getBlobToken(),
      contentType: finalMimeType,
      addRandomSuffix: false,
    });

    return NextResponse.json(
      {
        url: blob.url,
        pathname: blob.pathname,
        contentType: finalMimeType,
        size: bufferToUpload.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("File upload error:", error);
    return NextResponse.json(
      { message: "Failed to upload file. Please try again." },
      { status: 500 }
    );
  }
}

