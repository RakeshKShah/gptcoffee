import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthMocks, setupPostAuthMocks } from "../../helpers/mock-api.js";

test("Admin Can Create Account and Access Admin Functionality", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("admin_account_creation_and_access", testInfo.title);

  await recorder.step("Open the application and register scenario-specific auth and admin data mocks", async () => {
    await page.route("**/api/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ products: [], customizations: { sizes: [], milks: [], extras: [] } }),
      });
    });
    await setupAuthMocks(page, {
      loginScenario: "admin_success",
      signupScenario: "admin_signup_success",
      signupRole: "admin",
    });
    await setupPostAuthMocks(page, {
      role: "admin",
      menuScenario: "default",
      adminOrdersScenario: "default",
      adminSalesScenario: "default",
    });
    await page.goto("/");
  });

  await recorder.step("Navigate to signup and register a new admin account", async () => {
    await page.getByRole("button", { name: "signup" }).click();
    await page.getByLabel("Name").fill("Ari Admin");
    await page.getByLabel("Email").fill("new-admin@gptcoffee.test");
    await page.getByLabel("Password").fill("admin123");
    await page.getByRole("button", { name: "Create buyer account" }).click();
  });

  await recorder.step("Verify authentication succeeds into the admin dashboard", async () => {
    await expect(page.getByText("Admin Dashboard")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Manage orders from anywhere." })).toBeVisible();
    await expect(page.getByText("Coffee flavors")).toBeVisible();
    await expect(page.getByText("Customization options")).toBeVisible();
    await expect(page.getByText("Live order history")).toBeVisible();
  });

  await recorder.step("Verify admin management functionality is accessible and customer ordering UI is not shown", async () => {
    await expect(page.getByText("Daily sales")).toBeVisible();
    await expect(page.getByText("Monthly sales")).toBeVisible();
    await expect(page.getByText("All-time sales")).toBeVisible();
    await expect(page.getByRole("button", { name: "Add flavor" })).toBeVisible();
    await expect(page.getByText("Signature drinks")).toHaveCount(0);
    await expect(page.getByText("Your pickup status")).toHaveCount(0);
    await expect(page.getByText("Checkout for pickup")).toHaveCount(0);
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:admin_account_creation_and_access");
  await recorder.save(testInfo);
});
