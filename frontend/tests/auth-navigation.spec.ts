import { expect, test } from "@playwright/test";

test("role selection opens the correct registration form", async ({ page }) => {
  await page.goto("/role");
  await page.getByRole("link", { name: /Continue as Freelancer/ }).click();

  await expect(page).toHaveURL(/\/auth\/freelancer$/);
  await expect(
    page.getByRole("heading", { name: "Create your account" })
  ).toBeVisible();
  await expect(page.getByLabel("Email Address")).toHaveCount(1);
});

test("registration validates malformed email before sending a request", async ({
  page,
}) => {
  await page.goto("/auth/brand");
  await page.getByLabel("Full Name").fill("Test Brand");
  await page.getByLabel("Email Address").fill("not-an-email");
  await page.getByLabel("Password (min 8 chars)").fill("ValidPassword1!");
  await page.getByLabel("Confirm Password").fill("ValidPassword1!");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Create Account" }).click();

  await expect(page.getByText("Please enter a valid email address.", { exact: true })).toBeVisible();
});

test("landing page mobile navigation opens and reaches sign in", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open navigation menu" }).click();
  await page.getByRole("link", { name: "Sign In" }).click();

  await expect(page).toHaveURL(/\/role\?intent=signin$/);
  await expect(
    page.getByRole("heading", { name: "Sign In to Inkloom AI" })
  ).toBeVisible();
});
