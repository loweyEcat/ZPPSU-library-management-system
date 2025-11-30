import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { compressImageLossless } from "@/lib/image-compression";
import { sanitizeInput } from "@/lib/sanitize";
import { requireAuth } from "@/lib/auth-library";

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
  const sanitized = normalizeFilename(originalFilename || "profile");
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 9);
  const extension = sanitized.includes(".") ? sanitized.substring(sanitized.lastIndexOf(".")) : ".jpg";
  const baseName = sanitized.includes(".") ? sanitized.substring(0, sanitized.lastIndexOf(".")) : sanitized;
  return `profile_pictures/${userId}-${baseName}-${timestamp}-${randomSuffix}${extension}`;
};

export async function POST(request: Request) {
  try {
    const session = await requireAuth();

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { message: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB for profile pictures)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { message: "File size must be less than 5MB" },
        { status: 400 }
      );
    }

    // Validate file type (images only)
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { message: "File type not allowed. Please upload an image (JPEG, PNG, or WebP)." },
        { status: 400 }
      );
    }

    const originalBuffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type || "image/jpeg";

    // Compress image
    const { buffer: compressedBuffer, mimeType: compressedMimeType } =
      await compressImageLossless(originalBuffer, mimeType);

    const bufferToUpload =
      compressedBuffer.length < originalBuffer.length ? compressedBuffer : originalBuffer;
    const finalMimeType = bufferToUpload === compressedBuffer ? compressedMimeType : mimeType;

    const fileName = generateUniqueFilename(file.name, session.user.id);

    const blob = await put(fileName, bufferToUpload, {
      access: "public",
      token: getBlobToken(),
      contentType: finalMimeType,
      addRandomSuffix: false,
    });

    // Update user's profile_image in database
    const { prisma } = await import("@/lib/prisma");
    await prisma.lib_users.update({
      where: { id: session.user.id },
      data: { profile_image: blob.url },
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
    console.error("Profile picture upload error:", error);
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { message: "Failed to upload file. Please try again." },
      { status: 500 }
    );
  }
}

