import { put } from "@vercel/blob";
import { sanitizeInput } from "./sanitize";
import { compressImageLossless } from "./image-compression";

const getBlobToken = (): string => {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error("BLOB_READ_WRITE_TOKEN environment variable is required");
  }
  return token;
};

export type BlobFolder = "passport_photos" | "e_signatures" | "proof_of_payment";

const normalizeFilename = (filename: string, fallback: string): string => {
  const condensed = sanitizeInput(filename)
    .replace(/[^a-zA-Z0-9_.-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  if (condensed.length === 0) {
    return fallback;
  }
  return condensed.slice(0, 160);
};

const generateUniqueFilename = (originalFilename: string, folder: BlobFolder): string => {
  const sanitized = normalizeFilename(originalFilename, `${folder}-file`);
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 9);
  const extension = sanitized.includes(".") ? sanitized.substring(sanitized.lastIndexOf(".")) : "";
  const baseName = sanitized.includes(".") ? sanitized.substring(0, sanitized.lastIndexOf(".")) : sanitized;
  return `${folder}/${baseName}-${timestamp}-${randomSuffix}${extension}`;
};

export interface UploadBlobResult {
  url: string;
  pathname: string;
  contentType: string;
  size: number;
  fileName: string;
}

export async function uploadToBlobStorage(
  file: File,
  folder: BlobFolder,
  fallbackName: string,
): Promise<UploadBlobResult> {
  const originalBuffer = Buffer.from(await file.arrayBuffer());
  const mimeType = file.type || "application/octet-stream";

  const { buffer: compressedBuffer, mimeType: finalMimeType } =
    await compressImageLossless(originalBuffer, mimeType);

  const bufferToUpload =
    compressedBuffer.length < originalBuffer.length ? compressedBuffer : originalBuffer;
  const finalSize = bufferToUpload.length;
  const finalContentType = bufferToUpload === compressedBuffer ? finalMimeType : mimeType;

  const fileName = generateUniqueFilename(file.name || fallbackName, folder);

  const blob = await put(fileName, bufferToUpload, {
    access: "public",
    token: getBlobToken(),
    contentType: finalContentType,
    addRandomSuffix: false,
  });

  return {
    url: blob.url,
    pathname: blob.pathname,
    contentType: finalContentType,
    size: finalSize,
    fileName: normalizeFilename(file.name || fallbackName, fallbackName),
  };
}

