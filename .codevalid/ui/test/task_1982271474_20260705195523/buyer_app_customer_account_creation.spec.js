import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../helpers/execution-recorder.js";
import { setupAuthMocks, setupPostAuthMocks } from "../helpers/mock-api.js";

test("Customer account creation flow", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("buyer_app_customer_account_creation", "Customer account creation flow");

  try {
    await recorder.step("Clear any existing authenticated session");
    await page.addInitScript(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });

    await recorder.step("Register buyer signup and buyer post-auth API mocks");
    await setupAuthMocks(page, {
      signupScenario: "buyer_signup_success",
      signupRole: "buyer",
      loginScenario: "buyer_success",
    });
    await setupPostAuthMocks(page, {
      role: "buyer",
      menuScenario: "default",
      myOrdersScenario: "empty",
    });

    await recorder.step("Open the Buyer application");
    await page.goto("/");

    await expect(page.getByText("Order from home. Pick up when your cup is ready.")).toBeVisible();

    await recorder.step("Navigate to the account creation flow for a customer user");
    await page.getByRole("button", { name: "signup" }).click();
    await expect(page.getByRole("button", { name: "Create buyer account" })).toBeVisible();

    await recorder.step("Submit valid customer account information");
    await page.getByPlaceholder("Your name").fill("Maya Buyer");
    await page.getByPlaceholder("you@example.com").fill("new-buyer@gptcoffee.test");
    await page.locator('input[type="password"]').fill("buyer123");
    await page.getByRole("button", { name: "Create buyer account" }).click();

    await recorder.step("Verify the newly created customer account is authenticated and routed to customer functionality");
    await expect(page.getByRole("heading", { name: "Signature drinks" })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Your Cart|Pickup order|Start an order/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Your pickup status" })).toBeVisible();
    await expect(page.getByText("Admin Dashboard")).not.toBeVisible();

    console.log("CODEVALID_TEST_ASSERTION_OK:buyer_app_customer_account_creation");
  } finally {
    await recorder.save(testInfo);
  }
});
