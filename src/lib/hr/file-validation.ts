const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4 MB (Vercel body limit is 4.5 MB)
const PDF_MAGIC_BYTES = [0x25, 0x50, 0x44, 0x46, 0x2d]; // "%PDF-"

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates that an uploaded file is a genuine PDF and does not exceed 4 MB.
 * Checks MIME type, file size, and magic bytes (%PDF-).
 */
export async function validatePdfFile(file: File): Promise<FileValidationResult> {
  // Check file existence
  if (!file || !(file instanceof File)) {
    return { valid: false, error: "No file provided" };
  }

  // Check file size (max 4 MB)
  if (file.size === 0) {
    return { valid: false, error: "The uploaded file is empty" };
  }

  if (file.size > MAX_FILE_SIZE) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File is too large (${sizeMb} MB). Maximum allowed size is 4 MB.`,
    };
  }

  // Check MIME type
  if (file.type !== "application/pdf") {
    return {
      valid: false,
      error: "Only PDF files are accepted. Please upload a .pdf document.",
    };
  }

  // Check magic bytes (%PDF-)
  try {
    const buffer = await file.slice(0, 5).arrayBuffer();
    const bytes = new Uint8Array(buffer);

    for (let i = 0; i < PDF_MAGIC_BYTES.length; i++) {
      if (bytes[i] !== PDF_MAGIC_BYTES[i]) {
        return {
          valid: false,
          error:
            "File header is invalid. The file appears to be corrupted or not a real PDF.",
        };
      }
    }
  } catch (err) {
    console.error("Error reading file magic bytes:", err);
    return {
      valid: false,
      error: "Failed to read and verify the uploaded file.",
    };
  }

  return { valid: true };
}
