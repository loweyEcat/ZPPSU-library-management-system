import sharp from "sharp";

const IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

export async function compressImageLossless(
  buffer: Buffer,
  mimeType: string,
): Promise<{ buffer: Buffer; mimeType: string }> {
  if (!IMAGE_TYPES.has(mimeType.toLowerCase())) {
    return { buffer, mimeType };
  }

  try {
    const image = sharp(buffer);
    const metadata = await image.metadata();

    switch (mimeType.toLowerCase()) {
      case "image/png": {
        const compressed = await image
          .png({
            compressionLevel: 9,
            adaptiveFiltering: true,
            palette: metadata.hasAlpha ? false : true,
            effort: 10,
          })
          .toBuffer();
        return { buffer: compressed, mimeType: "image/png" };
      }

      case "image/webp": {
        const compressed = await image
          .webp({
            lossless: true,
            effort: 6,
          })
          .toBuffer();
        return { buffer: compressed, mimeType: "image/webp" };
      }

      case "image/jpeg":
      case "image/jpg": {
        const compressed = await image
          .jpeg({
            quality: 95,
            mozjpeg: true,
            progressive: true,
            optimizeScans: true,
          })
          .toBuffer();
        return { buffer: compressed, mimeType: "image/jpeg" };
      }

      default:
        return { buffer, mimeType };
    }
  } catch (error) {
    return { buffer, mimeType };
  }
}

