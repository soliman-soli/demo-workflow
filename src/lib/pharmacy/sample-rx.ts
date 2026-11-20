// Tiny valid 1x1 PNG fallback in case Canvas toBlob is unavailable
const FALLBACK_PNG_BYTES = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
  0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
  0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
  0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
  0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
]);

/**
 * Generates a realistic synthetic prescription PNG File + Data URL in memory
 * so visitors can test the image upload & Telegram review flow without real patient data.
 */
export async function createSampleRxFile(): Promise<{
  file: File;
  previewUrl: string;
}> {
  if (typeof document === "undefined") {
    const file = new File([FALLBACK_PNG_BYTES], "sample-rx-prescription.png", {
      type: "image/png",
    });
    return { file, previewUrl: "" };
  }

  const canvas = document.createElement("canvas");
  canvas.width = 480;
  canvas.height = 300;
  const ctx = canvas.getContext("2d");

  if (ctx) {
    ctx.fillStyle = "#f9f7f2";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "#1f6f5c";
    ctx.lineWidth = 3;
    ctx.strokeRect(12, 12, canvas.width - 24, canvas.height - 24);

    ctx.fillStyle = "#1f6f5c";
    ctx.font = "bold 20px sans-serif";
    ctx.fillText("DAWAA DEMO CLINIC", 28, 48);

    ctx.fillStyle = "#6f6a61";
    ctx.font = "12px monospace";
    ctx.fillText("SYNTHETIC PRESCRIPTION · DEMO ONLY", 28, 70);

    ctx.strokeStyle = "#d9d2c5";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(28, 84);
    ctx.lineTo(452, 84);
    ctx.stroke();

    ctx.fillStyle = "#1b1f24";
    ctx.font = "14px sans-serif";
    ctx.fillText("Patient: Youssef Adel (Demo)", 28, 112);

    ctx.fillStyle = "#1f6f5c";
    ctx.font = "bold 28px Georgia, serif";
    ctx.fillText("Rx", 28, 158);

    ctx.fillStyle = "#1b1f24";
    ctx.font = "bold 18px sans-serif";
    ctx.fillText("Hibiotic 1g tablets — 1 pack (x1)", 72, 154);

    ctx.fillStyle = "#4b5563";
    ctx.font = "14px sans-serif";
    ctx.fillText("Sig: 1 tab every 12 hours for 7 days", 72, 180);

    ctx.fillStyle = "#85570f";
    ctx.font = "12px monospace";
    ctx.fillText("Signed: Dr. Demo Physician · Valid 48h", 28, 260);
  }

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/png")
  );
  const previewUrl = canvas.toDataURL("image/png");

  if (!blob) {
    const file = new File([FALLBACK_PNG_BYTES], "sample-rx-prescription.png", {
      type: "image/png",
    });
    return { file, previewUrl };
  }

  const file = new File([blob], "sample-rx-prescription.png", {
    type: "image/png",
  });
  return { file, previewUrl };
}
