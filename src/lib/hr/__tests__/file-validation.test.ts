import { describe, expect, it } from "vitest";
import { validatePdfFile } from "../file-validation";

function makePdfFile(
  content: Uint8Array | string = "%PDF-1.7 sample pdf content",
  name = "cv.pdf",
  type = "application/pdf"
): File {
  const parts: BlobPart[] =
    typeof content === "string" ? [content] : [new Uint8Array(content.buffer as ArrayBuffer)];
  return new File(parts, name, { type });
}

describe("validatePdfFile", () => {
  it("accepts a valid PDF with %PDF- magic bytes under 4 MB", async () => {
    const file = makePdfFile();
    const res = await validatePdfFile(file);
    expect(res.valid).toBe(true);
  });

  it("rejects non-PDF mime types", async () => {
    const file = makePdfFile("%PDF-1.7 fake", "cv.txt", "text/plain");
    const res = await validatePdfFile(file);
    expect(res.valid).toBe(false);
    expect(res.error).toMatch(/Only PDF/i);
  });

  it("rejects files without %PDF- magic bytes even if mime is application/pdf", async () => {
    const file = makePdfFile("<html>not a pdf</html>", "fake.pdf", "application/pdf");
    const res = await validatePdfFile(file);
    expect(res.valid).toBe(false);
    expect(res.error).toMatch(/header is invalid|not a real PDF/i);
  });

  it("rejects PDFs larger than 4 MB", async () => {
    const big = new Uint8Array(4 * 1024 * 1024 + 10);
    big.set([0x25, 0x50, 0x44, 0x46, 0x2d], 0); // "%PDF-"
    const file = makePdfFile(big, "huge.pdf", "application/pdf");
    const res = await validatePdfFile(file);
    expect(res.valid).toBe(false);
    expect(res.error).toMatch(/too large|4 MB/i);
  });
});

