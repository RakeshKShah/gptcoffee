import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthMocks, setupPostAuthMocks } from "../../helpers/mock-api.js";

test("Customer Can Create an Account", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("customer_account_creation", "Customer Can Create an Account");

  await recorder.step("Set up mocked authentication and buyer post-login APIs");
  await setupAuthMocks(page, {
    signupScenario: "buyer_signup_success",
    signupRole: "buyer",
  });
  await setupPostAuthMocks(page, {
    role: "buyer",
    menuScenario: "default",
    myOrdersScenario: "empty",
  });

  await recorder.step("Open the AuthScreen");
  await page.goto("/");
  await expect(page.getByText("Order from home. Pick up when your cup is ready.")).toBeVisible();

  await recorder.step("Start the account creation flow");
  await page.getByRole("button", { name: /^signup$/i }).click();
  await expect(page.getByPlaceholder("Your name")).toBeVisible();

  await recorder.step("Enter valid account information for a customer user");
  await page.getByPlaceholder("Your name").fill("Maya Buyer");
  await page.getByPlaceholder("you@example.com").fill("new-buyer@gptcoffee.test");
  await page.getByPlaceholder("••••••••").fill("buyer123");

  await recorder.step("Submit the account creation request");
  await page.getByRole("button", { name: /create buyer account/i }).click();

  await recorder.step("Verify the customer account is created and customer access is available");
  await expect(page.getByRole("heading", { name: "Signature drinks" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Your pickup status" })).toBeVisible();
  await expect(page.getByText("Admin Dashboard")).toHaveCount(0);

  console.log("CODEVALID_TEST_ASSERTION_OK:customer_account_creation");
  await recorder.save(testInfo);
});
