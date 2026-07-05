import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthMocks, setupPostAuthMocks } from "../../helpers/mock-api.js";

test("Admin Login Provides Admin Access", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("admin_login_and_admin_access", "Admin Login Provides Admin Access");

  await recorder.step("Set up mocked admin login and dashboard APIs");
  await setupAuthMocks(page, {
    loginScenario: "admin_success",
  });
  await setupPostAuthMocks(page, {
    role: "admin",
    menuScenario: "default",
    adminOrdersScenario: "default",
    adminSalesScenario: "default",
  });

  await recorder.step("Open the AuthScreen");
  await page.goto("/");
  await expect(page.getByRole("button", { name: /^login$/i })).toBeVisible();

  await recorder.step("Enter valid admin account credentials");
  await page.getByPlaceholder("you@example.com").fill("admin@gptcoffee.test");
  await page.getByPlaceholder("••••••••").fill("admin123");

  await recorder.step("Submit the login request");
  await page.getByRole("button", { name: /^login$/i }).last().click();

  await recorder.step("Access the authenticated area of the application");
  await expect(page.getByText("Admin Dashboard")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Manage orders from anywhere." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Coffee flavors" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Customization options" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Live order history" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Signature drinks" })).toHaveCount(0);

  console.log("CODEVALID_TEST_ASSERTION_OK:admin_login_and_admin_access");
  await recorder.save(testInfo);
});
