export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024; // 20MB, pre-processing cap

const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.82;

// Decoding via createImageBitmap doubles as content-sniffing validation: a
// non-image file renamed with an image extension will fail here regardless
// of what its declared MIME type or filename claim.
export async function decodeImage(file: File): Promise<ImageBitmap> {
  return createImageBitmap(file);
}

export async function resizeAndCompress(bitmap: ImageBitmap): Promise<Blob> {
  let { width, height } = bitmap;

  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    if (width >= height) {
      height = Math.round((height / width) * MAX_DIMENSION);
      width = MAX_DIMENSION;
    } else {
      width = Math.round((width / height) * MAX_DIMENSION);
      height = MAX_DIMENSION;
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported in this browser.");
  ctx.drawImage(bitmap, 0, 0, width, height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("Could not compress image.")),
      "image/jpeg",
      JPEG_QUALITY
    );
  });
}
