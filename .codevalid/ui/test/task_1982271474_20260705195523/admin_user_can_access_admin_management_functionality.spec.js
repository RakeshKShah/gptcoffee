import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthMocks, setupPostAuthMocks } from "../../helpers/mock-api.js";

test("Admin user accesses admin management functionality after authentication", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder(
    "admin_user_can_access_admin_management_functionality",
    testInfo.title,
  );

  await recorder.step("Set up mocked APIs for admin login", async () => {
    await setupAuthMocks(page, {
      loginScenario: "admin_success",
      signupScenario: "buyer_signup_success",
    });
    await setupPostAuthMocks(page, {
      role: "admin",
      menuScenario: "default",
      adminOrdersScenario: "default",
      adminSalesScenario: "default",
    });
  });

  await recorder.step("Open the application", async () => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "GPT Coffee" })).toBeVisible();
  });

  await recorder.step("Navigate to the login flow", async () => {
    await page.getByRole("button", { name: "Login" }).first().click();
    await expect(page.getByRole("button", { name: "Login" }).last()).toBeVisible();
  });

  await recorder.step("Enter valid admin account credentials", async () => {
    await page.getByLabel("Email").fill("admin@gptcoffee.test");
    await page.getByLabel("Password").fill("admin123");
  });

  await recorder.step("Submit the login form", async () => {
    await page.getByRole("button", { name: /^Login$/ }).last().click();
  });

  await recorder.step("Verify admin management functionality is accessible", async () => {
    await expect(page.getByText("Admin Dashboard")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Manage orders from anywhere." })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Coffee flavors" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Customization options" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Live order history" })).toBeVisible();
    await expect(page.getByText("Daily sales")).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:admin_user_can_access_admin_management_functionality");
  await recorder.save(testInfo);
});
