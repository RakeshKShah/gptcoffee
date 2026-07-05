import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthMocks, setupPostAuthMocks } from "../../helpers/mock-api.js";

test("Customer role receives customer access only", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("buyer_app_customer_role_access", "Customer role receives customer access only");

  try {
    await recorder.step("Clear any existing authenticated session");
    await page.addInitScript(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });

    await recorder.step("Register customer login and buyer post-auth API mocks");
    await setupAuthMocks(page, {
      loginScenario: "buyer_success",
      signupScenario: "buyer_signup_success",
    });
    await setupPostAuthMocks(page, {
      role: "buyer",
      menuScenario: "default",
      myOrdersScenario: "empty",
    });

    await recorder.step("Open the Buyer application");
    await page.goto("/");

    await recorder.step("Authenticate using valid customer credentials");
    await expect(page.getByRole("button", { name: "Login" }).last()).toBeVisible();
    await page.getByPlaceholder("you@example.com").fill("buyer@gptcoffee.test");
    await page.locator('input[type="password"]').fill("buyer123");
    await page.getByRole("button", { name: "Login" }).last().click();

    await recorder.step("Verify customer ordering functionality is available after login");
    await expect(page.getByRole("heading", { name: "Signature drinks" })).toBeVisible();
    await expect(page.getByText("Customize every cup and check out for pickup.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Customize" }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: /Your Cart|Pickup order|Start an order/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Your pickup status" })).toBeVisible();
    await expect(page.getByText("Admin Dashboard")).not.toBeVisible();
    await expect(page.getByRole("heading", { name: "Manage orders from anywhere." })).not.toBeVisible();

    console.log("CODEVALID_TEST_ASSERTION_OK:buyer_app_customer_role_access");
  } finally {
    await recorder.save(testInfo);
  }
});
