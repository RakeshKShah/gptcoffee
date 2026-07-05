import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthMocks, setupPostAuthMocks } from "../../helpers/mock-api.js";

test("Customer Can Create Account and Access Customer Functionality", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("customer_account_creation_and_access", testInfo);

  await recorder.step("Open the application and register scenario-specific auth and buyer data mocks", async () => {
    await page.route("**/api/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ products: [], customizations: { sizes: [], milks: [], extras: [] } }),
      });
    });
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
    await page.goto("/");
  });

  await recorder.step("Navigate to signup and register a new customer account", async () => {
    await page.getByRole("button", { name: "signup" }).click();
    await page.getByLabel("Name").fill("Maya Buyer");
    await page.getByLabel("Email").fill("new-buyer@gptcoffee.test");
    await page.getByLabel("Password").fill("buyer123");
    await page.getByRole("button", { name: "Create buyer account" }).click();
  });

  await recorder.step("Verify authentication succeeds into the customer experience", async () => {
    await expect(page.getByText("Signature drinks")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Your pickup status" })).toBeVisible();
    await expect(page.getByText("Cloud Latte")).toBeVisible();
    await expect(page.getByText("Night Mocha")).toBeVisible();
    await expect(page.getByText("Start an order")).toBeVisible();
  });

  await recorder.step("Verify customer ordering functionality is accessible and admin functionality is not shown", async () => {
    await expect(page.getByRole("button", { name: "Customize" }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Checkout for pickup" })).toBeVisible();
    await expect(page.getByText("Admin Dashboard")).toHaveCount(0);
    await expect(page.getByText("Coffee flavors")).toHaveCount(0);
    await expect(page.getByText("Customization options")).toHaveCount(0);
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:customer_account_creation_and_access");
  await recorder.save(testInfo);
});
