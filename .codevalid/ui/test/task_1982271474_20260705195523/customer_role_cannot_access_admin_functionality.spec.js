import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthMocks, setupPostAuthMocks } from "../../helpers/mock-api.js";

test("Customer Role Is Restricted From Admin Functionality", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("customer_role_cannot_access_admin_functionality", testInfo);

  await recorder.step("Open the application with valid customer login and buyer post-auth mocks", async () => {
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

  await recorder.step("Log in using a valid customer account", async () => {
    await page.getByLabel("Email").fill("buyer@gptcoffee.test");
    await page.getByLabel("Password").fill("buyer123");
    await page.getByRole("button", { name: "Login" }).click();
  });

  await recorder.step("Verify customer areas are accessible", async () => {
    await expect(page.getByText("Signature drinks")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Your pickup status" })).toBeVisible();
    await expect(page.getByText("Cloud Latte")).toBeVisible();
    await expect(page.getByRole("button", { name: "Customize" }).first()).toBeVisible();
  });

  await recorder.step("Verify admin management functionality is not available to the customer", async () => {
    await expect(page.getByText("Admin Dashboard")).toHaveCount(0);
    await expect(page.getByText("Manage orders from anywhere.")).toHaveCount(0);
    await expect(page.getByText("Coffee flavors")).toHaveCount(0);
    await expect(page.getByText("Customization options")).toHaveCount(0);
    await expect(page.getByText("Live order history")).toHaveCount(0);
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:customer_role_cannot_access_admin_functionality");
  await recorder.save(testInfo);
});
