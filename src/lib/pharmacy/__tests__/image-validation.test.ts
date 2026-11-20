import { describe, expect, it } from "vitest";
import { MAX_IMAGE_SIZE, validateImageFile } from "../image-validation";

function makeImageFile(bytes: number[] | Uint8Array, name: string, type: string): File {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return new File([arr as unknown as BlobPart], name, { type });
}

describe("validateImageFile", () => {
  it("accepts a valid PNG with PNG magic bytes under 5 MB", async () => {
    const file = makeImageFile(
      [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d],
      "rx.png",
      "image/png"
    );
    const res = await validateImageFile(file);
    expect(res.valid).toBe(true);
  });

  it("accepts a valid JPEG with JPEG magic bytes under 5 MB", async () => {
    const file = makeImageFile(
      [0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01],
      "rx.jpg",
      "image/jpeg"
    );
    const res = await validateImageFile(file);
    expect(res.valid).toBe(true);
  });

  it("accepts a valid WebP with RIFF+WEBP headers under 5 MB", async () => {
    const file = makeImageFile(
      [
        0x52, 0x49, 0x46, 0x46, // RIFF
        0x24, 0x00, 0x00, 0x00,
        0x57, 0x45, 0x42, 0x50, // WEBP
      ],
      "rx.webp",
      "image/webp"
    );
    const res = await validateImageFile(file);
    expect(res.valid).toBe(true);
  });

  it("rejects non-image MIME types", async () => {
    const file = makeImageFile([0x25, 0x50, 0x44, 0x46, 0x2d], "doc.pdf", "application/pdf");
    const res = await validateImageFile(file);
    expect(res.valid).toBe(false);
    expect(res.error).toMatch(/JPEG, PNG, or WebP/i);
  });

  it("rejects spoofed image magic bytes", async () => {
    const file = makeImageFile([0x3c, 0x73, 0x76, 0x67, 0x3e, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00], "fake.png", "image/png");
    const res = await validateImageFile(file);
    expect(res.valid).toBe(false);
    expect(res.error).toMatch(/header does not match/i);
  });

  it("rejects empty files and files exceeding 5 MB", async () => {
    const empty = makeImageFile([], "empty.jpg", "image/jpeg");
    const emptyRes = await validateImageFile(empty);
    expect(emptyRes.valid).toBe(false);
    expect(emptyRes.error).toMatch(/empty/i);

    const big = new Uint8Array(MAX_IMAGE_SIZE + 10);
    big.set([0xff, 0xd8, 0xff], 0);
    const large = makeImageFile(big, "huge.jpg", "image/jpeg");
    const largeRes = await validateImageFile(large);
    expect(largeRes.valid).toBe(false);
    expect(largeRes.error).toMatch(/5 MB/i);
  });
});
