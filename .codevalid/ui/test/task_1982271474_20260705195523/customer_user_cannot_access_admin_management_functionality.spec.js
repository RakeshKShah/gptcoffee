import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../../helpers/execution-recorder.js";
import { setupAuthMocks, setupPostAuthMocks } from "../../../helpers/mock-api.js";

test("Customer user is restricted from admin management functionality", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder(
    "customer_user_cannot_access_admin_management_functionality",
    testInfo.title,
  );

  await recorder.step("Set up mocked APIs for customer login", async () => {
    await setupAuthMocks(page, {
      loginScenario: "buyer_success",
      signupScenario: "buyer_signup_success",
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

  await recorder.step("Navigate to the login flow", async () => {
    await page.getByRole("button", { name: "Login" }).click();
    await expect(page.getByRole("button", { name: /^Login$/ })).toBeVisible();
  });

  await recorder.step("Enter valid customer account credentials", async () => {
    await page.getByLabel("Email").fill("buyer@gptcoffee.test");
    await page.getByLabel("Password").fill("buyer123");
  });

  await recorder.step("Submit the login form", async () => {
    await page.getByRole("button", { name: /^Login$/ }).click();
  });

  await recorder.step("Verify admin management functionality is denied", async () => {
    await expect(page.getByRole("heading", { name: "Signature drinks" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Your pickup status" })).toBeVisible();
    await expect(page.getByText("Admin Dashboard")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Manage orders from anywhere." })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Coffee flavors" })).toHaveCount(0);
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:customer_user_cannot_access_admin_management_functionality");
  await recorder.save(testInfo);
});
