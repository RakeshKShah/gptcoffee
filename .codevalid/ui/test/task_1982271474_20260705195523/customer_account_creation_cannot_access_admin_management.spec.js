import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../../helpers/execution-recorder.js";
import { setupAuthMocks, setupPostAuthMocks } from "../../../helpers/mock-api.js";

test("New customer account cannot access admin management functionality", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder(
    "customer_account_creation_cannot_access_admin_management",
    testInfo.title,
  );

  await recorder.step("Set up mocked APIs for customer account creation", async () => {
    await setupAuthMocks(page, {
      loginScenario: "buyer_success",
      signupScenario: "buyer_signup_success",
      signupRole: "buyer",
    });
    await setupPostAuthMocks(page, {
      role: "buyer",
      menuScenario: "default",
      myOrdersScenario: "empty",
    });
  });

  await recorder.step("Open the application", async () => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "GPT Coffee" })).toBeVisible();
  });

  await recorder.step("Navigate to the account creation flow", async () => {
    await page.getByRole("button", { name: "Signup" }).click();
    await expect(page.getByLabel("Name")).toBeVisible();
  });

  await recorder.step("Create a new customer account with valid registration data", async () => {
    await page.getByLabel("Name").fill("Maya Buyer");
    await page.getByLabel("Email").fill("new-buyer@gptcoffee.test");
    await page.getByLabel("Password").fill("buyer123");
  });

  await recorder.step("Complete account creation", async () => {
    await page.getByRole("button", { name: "Create buyer account" }).click();
  });

  await recorder.step("Verify admin management functionality is denied for the new customer", async () => {
    await expect(page.getByRole("heading", { name: "Signature drinks" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Your pickup status" })).toBeVisible();
    await expect(page.getByText("Admin Dashboard")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Coffee flavors" })).toHaveCount(0);
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:customer_account_creation_cannot_access_admin_management");
  await recorder.save(testInfo);
});
