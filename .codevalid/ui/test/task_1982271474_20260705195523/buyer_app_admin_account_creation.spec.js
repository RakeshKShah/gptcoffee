import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthMocks, setupPostAuthMocks } from "../../helpers/mock-api.js";

test("Admin account creation flow", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("buyer_app_admin_account_creation", "Admin account creation flow");

  try {
    await recorder.step("Clear any existing authenticated session");
    await page.addInitScript(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });

    await recorder.step("Register admin signup and admin post-auth API mocks");
    await setupAuthMocks(page, {
      signupScenario: "admin_signup_success",
      signupRole: "admin",
      loginScenario: "admin_success",
    });
    await setupPostAuthMocks(page, {
      role: "admin",
      menuScenario: "default",
      adminOrdersScenario: "default",
      adminSalesScenario: "default",
    });

    await recorder.step("Open the Buyer application");
    await page.goto("/");

    await expect(page.getByText("Order from home. Pick up when your cup is ready.")).toBeVisible();

    await recorder.step("Navigate to the account creation flow for an admin user");
    await page.getByRole("button", { name: "signup" }).click();
    await expect(page.getByRole("button", { name: "Create buyer account" })).toBeVisible();

    await recorder.step("Submit valid admin account information");
    await page.getByPlaceholder("Your name").fill("Ari Admin");
    await page.getByPlaceholder("you@example.com").fill("new-admin@gptcoffee.test");
    await page.locator('input[type="password"]').fill("admin123");
    await page.getByRole("button", { name: "Create buyer account" }).click();

    await recorder.step("Verify the newly created admin account is authenticated and routed to admin management functionality");
    await expect(page.getByText("Admin Dashboard")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Manage orders from anywhere." })).toBeVisible();
    await expect(page.getByText("Daily sales")).toBeVisible();
    await expect(page.getByText("Monthly sales")).toBeVisible();
    await expect(page.getByText("All-time sales")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Signature drinks" })).not.toBeVisible();

    console.log("CODEVALID_TEST_ASSERTION_OK:buyer_app_admin_account_creation");
  } finally {
    await recorder.save(testInfo);
  }
});
