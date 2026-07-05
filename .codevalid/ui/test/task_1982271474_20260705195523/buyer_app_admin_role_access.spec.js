import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthMocks, setupPostAuthMocks } from "../../helpers/mock-api.js";

test("Admin role receives admin access only", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("buyer_app_admin_role_access", "Admin role receives admin access only");

  try {
    await recorder.step("Clear any existing authenticated session");
    await page.addInitScript(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });

    await recorder.step("Register admin login and admin post-auth API mocks");
    await setupAuthMocks(page, {
      loginScenario: "admin_success",
      signupScenario: "admin_signup_success",
    });
    await setupPostAuthMocks(page, {
      role: "admin",
      menuScenario: "default",
      adminOrdersScenario: "default",
      adminSalesScenario: "default",
    });

    await recorder.step("Open the Buyer application");
    await page.goto("/");

    await recorder.step("Authenticate using valid admin credentials");
    await expect(page.getByRole("button", { name: "Login" }).last()).toBeVisible();
    await page.getByPlaceholder("you@example.com").fill("admin@gptcoffee.test");
    await page.locator('input[type="password"]').fill("admin123");
    await page.getByRole("button", { name: "Login" }).last().click();

    await recorder.step("Verify admin management functionality is available after login");
    await expect(page.getByText("Admin Dashboard")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Manage orders from anywhere." })).toBeVisible();
    await expect(page.getByText("Orders", { exact: true })).toBeVisible();
    await expect(page.getByText("Daily sales")).toBeVisible();
    await expect(page.getByText("Monthly sales")).toBeVisible();
    await expect(page.getByText("All-time sales")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Live order history" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Signature drinks" })).not.toBeVisible();
    await expect(page.getByRole("heading", { name: "Your pickup status" })).not.toBeVisible();

    console.log("CODEVALID_TEST_ASSERTION_OK:buyer_app_admin_role_access");
  } finally {
    await recorder.save(testInfo);
  }
});
