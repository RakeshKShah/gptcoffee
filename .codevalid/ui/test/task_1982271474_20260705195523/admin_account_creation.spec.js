import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthMocks, setupPostAuthMocks } from "../../helpers/mock-api.js";

test("Admin Can Create an Account", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("admin_account_creation", "Admin Can Create an Account");

  await recorder.step("Set up mocked authentication and admin post-login APIs");
  await setupAuthMocks(page, {
    signupScenario: "admin_signup_success",
    signupRole: "admin",
  });
  await setupPostAuthMocks(page, {
    role: "admin",
    menuScenario: "default",
    adminOrdersScenario: "default",
    adminSalesScenario: "default",
  });

  await recorder.step("Open the AuthScreen");
  await page.goto("/");
  await expect(page.getByText("Order from home. Pick up when your cup is ready.")).toBeVisible();

  await recorder.step("Start the account creation flow");
  await page.getByRole("button", { name: /^signup$/i }).click();
  await expect(page.getByPlaceholder("Your name")).toBeVisible();

  await recorder.step("Enter valid account information for an admin user");
  await page.getByPlaceholder("Your name").fill("Ari Admin");
  await page.getByPlaceholder("you@example.com").fill("new-admin@gptcoffee.test");
  await page.getByPlaceholder("••••••••").fill("admin123");

  await recorder.step("Submit the account creation request");
  await page.getByRole("button", { name: /create buyer account/i }).click();

  await recorder.step("Verify the admin account is created and admin management access is available");
  await expect(page.getByText("Admin Dashboard")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Manage orders from anywhere." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Coffee flavors" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Customization options" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Live order history" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Signature drinks" })).toHaveCount(0);

  console.log("CODEVALID_TEST_ASSERTION_OK:admin_account_creation");
  await recorder.save(testInfo);
});
