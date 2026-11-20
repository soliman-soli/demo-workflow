export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const JPEG_MAGIC = [0xff, 0xd8, 0xff];
const RIFF_MAGIC = [0x52, 0x49, 0x46, 0x46]; // "RIFF"
const WEBP_MAGIC = [0x57, 0x45, 0x42, 0x50]; // "WEBP"

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

function matchesAt(bytes: Uint8Array, expected: number[], offset = 0): boolean {
  if (bytes.length < offset + expected.length) return false;
  for (let i = 0; i < expected.length; i++) {
    if (bytes[offset + i] !== expected[i]) return false;
  }
  return true;
}

/**
 * Validates an uploaded prescription photo: checks existence, non-empty,
 * 5 MB max size, MIME allow-list (JPEG/PNG/WebP), and file magic bytes.
 */
export async function validateImageFile(
  file: File
): Promise<ImageValidationResult> {
  if (!file || !(file instanceof File)) {
    return { valid: false, error: "No image file provided." };
  }

  if (file.size === 0) {
    return { valid: false, error: "The uploaded image is empty." };
  }

  if (file.size > MAX_IMAGE_SIZE) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `Image is too large (${sizeMb} MB). Maximum allowed size is 5 MB.`,
    };
  }

  if (!ALLOWED_IMAGE_MIME_TYPES.has(file.type)) {
    return {
      valid: false,
      error: "Only JPEG, PNG, or WebP images are accepted.",
    };
  }

  try {
    const buffer = await file.slice(0, 12).arrayBuffer();
    const bytes = new Uint8Array(buffer);

    if (file.type === "image/jpeg" && !matchesAt(bytes, JPEG_MAGIC)) {
      return {
        valid: false,
        error: "File header does not match a valid JPEG image.",
      };
    }

    if (file.type === "image/png" && !matchesAt(bytes, PNG_MAGIC)) {
      return {
        valid: false,
        error: "File header does not match a valid PNG image.",
      };
    }

    if (
      file.type === "image/webp" &&
      (!matchesAt(bytes, RIFF_MAGIC, 0) || !matchesAt(bytes, WEBP_MAGIC, 8))
    ) {
      return {
        valid: false,
        error: "File header does not match a valid WebP image.",
      };
    }
  } catch (err) {
    console.error("[validateImageFile] Error reading image magic bytes:", err);
    return {
      valid: false,
      error: "Failed to read and verify the uploaded image.",
    };
  }

  return { valid: true };
}
