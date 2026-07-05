import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthMocks, setupPostAuthMocks } from "../../helpers/mock-api.js";

test("Customer Login Provides Customer Access", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("customer_login_and_customer_access", "Customer Login Provides Customer Access");

  await recorder.step("Set up mocked customer login and buyer APIs");
  await setupAuthMocks(page, {
    loginScenario: "buyer_success",
  });
  await setupPostAuthMocks(page, {
    role: "buyer",
    menuScenario: "default",
    myOrdersScenario: "empty",
  });

  await recorder.step("Open the AuthScreen");
  await page.goto("/");
  await expect(page.getByRole("button", { name: /^login$/i })).toBeVisible();

  await recorder.step("Enter valid customer account credentials");
  await page.getByPlaceholder("you@example.com").fill("buyer@gptcoffee.test");
  await page.getByPlaceholder("••••••••").fill("buyer123");

  await recorder.step("Submit the login request");
  await page.getByRole("button", { name: /^login$/i }).last().click();

  await recorder.step("Access the authenticated area of the application");
  await expect(page.getByRole("heading", { name: "Signature drinks" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Your pickup status" })).toBeVisible();
  await expect(page.getByText("Cloud Latte")).toBeVisible();
  await expect(page.getByRole("button", { name: "Customize" }).first()).toBeVisible();
  await expect(page.getByText("Admin Dashboard")).toHaveCount(0);

  console.log("CODEVALID_TEST_ASSERTION_OK:customer_login_and_customer_access");
  await recorder.save(testInfo);
});
