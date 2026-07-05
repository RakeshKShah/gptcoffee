import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthMocks, setupPostAuthMocks } from "../../helpers/mock-api.js";

test("Users Receive Access Based on Assigned Role", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("role_based_access_separation", "Users Receive Access Based on Assigned Role");

  await recorder.step("Set up mocked customer and admin authentication plus role-specific APIs");
  await setupAuthMocks(page, {
    loginScenario: "buyer_success",
  });
  await setupPostAuthMocks(page, {
    role: "buyer",
    menuScenario: "default",
    myOrdersScenario: "empty",
  });
  await setupAuthMocks(page, {
    loginScenario: "admin_success",
  });
  await setupPostAuthMocks(page, {
    role: "admin",
    menuScenario: "default",
    adminOrdersScenario: "default",
    adminSalesScenario: "default",
  });

  await recorder.step("Log in using a customer account");
  await page.goto("/");
  await page.getByPlaceholder("you@example.com").fill("buyer@gptcoffee.test");
  await page.getByPlaceholder("••••••••").fill("buyer123");
  await page.getByRole("button", { name: /^login$/i }).last().click();

  await recorder.step("Verify customer ordering functionality is accessible");
  await expect(page.getByRole("heading", { name: "Signature drinks" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Your pickup status" })).toBeVisible();
  await expect(page.getByText("Cloud Latte")).toBeVisible();
  await expect(page.getByText("Admin Dashboard")).toHaveCount(0);

  await recorder.step("Log out if logout functionality is available");
  await page.getByRole("button", { name: "Logout" }).click();
  await expect(page.getByText("Order from home. Pick up when your cup is ready.")).toBeVisible();

  await recorder.step("Log in using an admin account");
  await page.getByPlaceholder("you@example.com").fill("admin@gptcoffee.test");
  await page.getByPlaceholder("••••••••").fill("admin123");
  await page.getByRole("button", { name: /^login$/i }).last().click();

  await recorder.step("Verify admin management functionality is accessible");
  await expect(page.getByText("Admin Dashboard")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Coffee flavors" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Customization options" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Live order history" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Signature drinks" })).toHaveCount(0);

  console.log("CODEVALID_TEST_ASSERTION_OK:role_based_access_separation");
  await recorder.save(testInfo);
});
