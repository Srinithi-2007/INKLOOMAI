import { expect, test } from "@playwright/test";

test.describe("Protected Routes and Role-based Redirection", () => {
  test("unauthenticated visitor accessing /brand is redirected to signin", async ({
    page,
  }) => {
    await page.goto("/brand");
    await expect(page).toHaveURL(/\/role\?intent=signin$/);
  });

  test("unauthenticated visitor accessing /freelancer is redirected to signin", async ({
    page,
  }) => {
    await page.goto("/freelancer");
    await expect(page).toHaveURL(/\/role\?intent=signin$/);
  });

  test("unauthenticated visitor accessing /brand/campaigns is redirected to signin", async ({
    page,
  }) => {
    await page.goto("/brand/campaigns");
    await expect(page).toHaveURL(/\/role\?intent=signin$/);
  });

  test("unauthenticated visitor accessing /brand/reviews is redirected to signin", async ({
    page,
  }) => {
    await page.goto("/brand/reviews");
    await expect(page).toHaveURL(/\/role\?intent=signin$/);
  });

  test("unauthenticated visitor accessing /brand/dna is redirected to signin", async ({
    page,
  }) => {
    await page.goto("/brand/dna");
    await expect(page).toHaveURL(/\/role\?intent=signin$/);
  });

  test("unauthenticated visitor accessing /brand/governance is redirected to signin", async ({
    page,
  }) => {
    await page.goto("/brand/governance");
    await expect(page).toHaveURL(/\/role\?intent=signin$/);
  });
});

test.describe("Responsive Viewport Layouts", () => {
  test("desktop layout renders landing page CTA and navigation correctly", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Get Started" }).first()
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Explore Features" })
    ).toBeVisible();
  });

  test("tablet layout (768x1024) renders role selection cards responsively", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/role");
    await expect(
      page.getByRole("heading", { name: "I'm a Freelancer" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "I'm a Brand" })
    ).toBeVisible();
  });

  test("mobile layout (390x844) renders auth forms cleanly", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/auth/freelancer");
    await expect(
      page.getByRole("heading", { name: "Create your account" })
    ).toBeVisible();
    await expect(page.getByLabel("Full Name")).toBeVisible();
    await expect(page.getByLabel("Email Address")).toBeVisible();
  });
});

test.describe("Frontend Form Validation", () => {
  test("freelancer registration validates password mismatch", async ({ page }) => {
    await page.goto("/auth/freelancer");
    await page.getByLabel("Full Name").fill("Jane Doe");
    await page.getByLabel("Email Address").fill("jane.doe@example.com");
    await page.getByLabel("Password (min 8 chars)").fill("Password123!");
    await page.getByLabel("Confirm Password").fill("MismatchPassword456!");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Create Account" }).click();

    await expect(
      page.getByText("Passwords do not match.", { exact: true })
    ).toBeVisible();
  });

  test("switching between registration and sign in tabs works", async ({
    page,
  }) => {
    await page.goto("/auth/brand");
    await expect(
      page.getByRole("heading", { name: "Create your account" })
    ).toBeVisible();

    await page.getByRole("button", { name: "Sign In" }).click();
    await expect(
      page.getByRole("heading", { name: "Sign In", exact: true })
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
  });
});
