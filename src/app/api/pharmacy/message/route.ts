import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/hr/rate-limit";
import { formFile, formString, jsonError, sleep, tooManyRequests } from "@/lib/hr/http";
import { validateImageFile } from "@/lib/pharmacy/image-validation";
import { processPharmacyMessage } from "@/lib/pharmacy/engine";
import {
  buildWhatsAppWebhookPayload,
  isPharmacyMockMode,
  pharmacyN8nFetch,
} from "@/lib/pharmacy/n8n";
import {
  PharmacyMessageInputSchema,
  PharmacyMessageResponseSchema,
} from "@/lib/pharmacy/schemas";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const rl = await checkRateLimit(request, "pharmacyMessage");
  if (!rl.success) {
    return tooManyRequests(rl, "Too many messages sent. Please wait a minute.");
  }

  const contentType = request.headers.get("content-type") ?? "";
  let rawText = "";
  let rawCustomer: string | undefined;
  let imageFile: File | null = null;

  if (contentType.includes("multipart/form-data")) {
    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return jsonError("Invalid upload payload. Maximum image size is 5 MB.", 400);
    }
    rawText = formString(form, "text") ?? "";
    rawCustomer = formString(form, "customer");
    imageFile = formFile(form, "image") ?? formFile(form, "file");

    if (imageFile) {
      const check = await validateImageFile(imageFile);
      if (!check.valid) {
        return jsonError(check.error ?? "Invalid image file.", 400);
      }
    }
  } else {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonError("Invalid request body.", 400);
    }
    if (body && typeof body === "object") {
      const obj = body as Record<string, unknown>;
      rawText = typeof obj.text === "string" ? obj.text : "";
      rawCustomer = typeof obj.customer === "string" ? obj.customer : undefined;
    }
  }

  const parsed = PharmacyMessageInputSchema.safeParse({
    text: rawText,
    customer: rawCustomer,
  });

  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid message.", 400);
  }

  if (!parsed.data.text && !imageFile) {
    return jsonError(
      "Please type a medicine request or attach a prescription photo.",
      400
    );
  }

  if (isPharmacyMockMode()) {
    await sleep(220);
    const mockRes = processPharmacyMessage({
      text: parsed.data.text,
      customer: parsed.data.customer,
      hasImage: Boolean(imageFile),
      imageName: imageFile?.name,
    });
    const validated = PharmacyMessageResponseSchema.safeParse(mockRes);
    if (!validated.success) {
      console.error("[pharmacy/message] Mock schema mismatch:", validated.error.issues);
      return jsonError("Internal simulation error.", 500);
    }
    return NextResponse.json(validated.data);
  }

  const waPayload = buildWhatsAppWebhookPayload({
    text: parsed.data.text,
    customer: parsed.data.customer,
    hasImage: Boolean(imageFile),
    imageName: imageFile?.name,
    imageMimeType: imageFile?.type,
  });

  let forwardBody: FormData | typeof waPayload = waPayload;
  if (imageFile) {
    const fd = new FormData();
    fd.append("payload", JSON.stringify(waPayload));
    fd.append("image", imageFile, imageFile.name || "prescription.png");
    forwardBody = fd;
  }

  const result = await pharmacyN8nFetch("/pharmacy/message", {
    method: "POST",
    body: forwardBody,
    schema: PharmacyMessageResponseSchema,
  });

  if (!result.ok) {
    return jsonError(
      "Couldn't reach the pharmacy workflow right now. Please try again.",
      result.status
    );
  }

  return NextResponse.json(result.data);
}
