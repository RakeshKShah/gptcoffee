import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthMocks, setupPostAuthMocks } from "../../helpers/mock-api.js";

test("Admin Role Receives Admin Management Access", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("admin_role_access_validation", testInfo.title);

  await recorder.step("Open the application with valid admin login and admin dashboard mocks", async () => {
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

  await recorder.step("Log in using a valid admin account", async () => {
    await page.getByLabel("Email").fill("admin@gptcoffee.test");
    await page.getByLabel("Password").fill("admin123");
    await page.getByRole("button", { name: "Login" }).last().click();
  });

  await recorder.step("Verify admin management functionality is accessible", async () => {
    await expect(page.getByText("Admin Dashboard")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Manage orders from anywhere." })).toBeVisible();
    await expect(page.getByText("Coffee flavors")).toBeVisible();
    await expect(page.getByText("Customization options")).toBeVisible();
    await expect(page.getByText("Live order history")).toBeVisible();
    await expect(page.getByText("Daily sales")).toBeVisible();
    await expect(page.getByText("Monthly sales")).toBeVisible();
    await expect(page.getByText("All-time sales")).toBeVisible();
  });

  await recorder.step("Verify customer-only ordering UI is not the active experience", async () => {
    await expect(page.getByText("Signature drinks")).toHaveCount(0);
    await expect(page.getByText("Your pickup status")).toHaveCount(0);
    await expect(page.getByText("Checkout for pickup")).toHaveCount(0);
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:admin_role_access_validation");
  await recorder.save(testInfo);
});
