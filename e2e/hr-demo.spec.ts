import { expect, test } from "@playwright/test";

const SAMPLE_PDF_BYTES = Buffer.from("%PDF-1.7\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF", "utf-8");

test.describe("Soliman Portfolio & HR Demo Smoke Suite (USE_MOCKS=true)", () => {
  test("1. Portfolio home renders hero, project cards, and opens HR Demo", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("backend-first products");
    await expect(page.getByText("C++ / Qt Desktop Dashboard")).toBeVisible();
    await expect(page.getByText("Isometric Island Desktop Scene")).toBeVisible();
    await expect(page.getByText("AI Car-Ad Video Pipeline")).toBeVisible();

    await page.getByRole("link", { name: /HR Demo/i }).first().click();
    await expect(page).toHaveURL(/\/projects\/hr-system$/);
    await expect(page.getByRole("heading", { name: "Hello! What would you like to do today?" })).toBeVisible();
  });

  test("2. Ask HR flow sends a FAQ question and renders policy source chips", async ({ page }) => {
    await page.goto("/projects/hr-system/ask");
    await page.getByRole("button", { name: "How many annual leave days do I get?" }).click();
    await expect(page.getByText(/24 working days/i)).toBeVisible();
    await expect(page.getByText("Annual Leave & Time Off Policy 2026")).toBeVisible();
  });

  test("3. Career Coach flow validates PDF upload and renders match score report", async ({ page }) => {
    await page.goto("/projects/hr-system/coach");
    await page.getByLabel("Your name").fill("Soliman Tester");
    await page.getByLabel("Email").fill("soliman@example.com");
    await page.getByLabel("Target role").fill("Full-Stack Software Engineer");

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "soliman-cv.pdf",
      mimeType: "application/pdf",
      buffer: SAMPLE_PDF_BYTES,
    });

    await page.getByRole("button", { name: "Get my report" }).click();
    await expect(page.getByText("Strengths")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/cover letter and sample interview answers are on the way/i)).toBeVisible();
  });

  test("4. Apply flow selects role, submits application, and never reveals score", async ({ page }) => {
    await page.goto("/projects/hr-system/apply");
    await page.getByRole("radio", { name: /Full-Stack Software Engineer/i }).click();
    await page.getByRole("button", { name: /Continue with/i }).click();

    await page.getByLabel("Full name").fill("Soliman Applicant");
    await page.getByLabel("Email").fill("applicant@example.com");
    await page.getByLabel("LinkedIn URL").fill("https://www.linkedin.com/in/soliman");

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "applicant-cv.pdf",
      mimeType: "application/pdf",
      buffer: SAMPLE_PDF_BYTES,
    });

    await page.getByLabel(/I understand this is a demo/i).check();
    await page.getByRole("button", { name: "Submit application" }).click();

    await expect(page.getByRole("heading", { name: "Application received." })).toBeVisible();
    await expect(page.getByText(/hear back by email within 48 hours/i)).toBeVisible();
    await expect(page.getByText(/score/i)).toHaveCount(0);
  });

  test("5. HR Gate blocks unauthenticated access and logs into Recruiter Dashboard", async ({ page }) => {
    await page.goto("/projects/hr-system/hr/dashboard");
    await expect(page).toHaveURL(/\/projects\/hr-system\/hr$/);

    await page.getByLabel("Passcode").fill("demo-recruiter-2024");
    await page.getByRole("button", { name: "Enter dashboard" }).click();

    await expect(page).toHaveURL(/\/projects\/hr-system\/hr\/dashboard$/);
    await expect(page.getByRole("heading", { name: "Recruiter dashboard" })).toBeVisible();
    await expect(page.getByText("Tarek Mostafa")).toBeVisible();
    await expect(page.getByText("Karim Adel")).toBeVisible();

    // Click auto-rejected candidate and verify no interview questions message
    await page.getByText("Karim Adel").click();
    await expect(
      page.getByText("No interview questions are generated for auto-rejected candidates.")
    ).toBeVisible();
  });
});

