import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthMocks, setupPostAuthMocks } from "../../helpers/mock-api.js";

test("Existing Authenticated Users Can Log In", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("authenticated_login_for_existing_users", testInfo.title);

  await recorder.step("Open the application and register mocks for both valid customer and admin login scenarios", async () => {
    await setupAuthMocks(page, {
      loginScenario: "buyer_success",
      signupScenario: "buyer_signup_success",
      signupRole: "buyer",
    });
    await setupAuthMocks(page, {
      loginScenario: "admin_success",
      signupScenario: "admin_signup_success",
      signupRole: "admin",
    });
    await setupPostAuthMocks(page, {
      role: "buyer",
      menuScenario: "default",
      myOrdersScenario: "empty",
    });
    await setupPostAuthMocks(page, {
      role: "admin",
      menuScenario: "default",
      adminOrdersScenario: "default",
      adminSalesScenario: "default",
    });
    await page.goto("/");
  });

  await recorder.step("Log in using valid customer account credentials and verify customer access", async () => {
    await page.getByLabel("Email").fill("buyer@gptcoffee.test");
    await page.getByLabel("Password").fill("buyer123");
    await page.getByRole("button", { name: "Login" }).last().click();
    await expect(page.getByText("Signature drinks")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Your pickup status" })).toBeVisible();
  });

  await recorder.step("Log out from the customer session if logout is available", async () => {
    await page.getByRole("button", { name: "Logout" }).click();
    await expect(page.getByRole("button", { name: "Login" }).last()).toBeVisible();
  });

  await recorder.step("Log in using valid admin account credentials and verify admin access", async () => {
    await page.getByLabel("Email").fill("admin@gptcoffee.test");
    await page.getByLabel("Password").fill("admin123");
    await page.getByRole("button", { name: "Login" }).last().click();
    await expect(page.getByText("Admin Dashboard")).toBeVisible();
    await expect(page.getByText("Coffee flavors")).toBeVisible();
    await expect(page.getByText("Live order history")).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:authenticated_login_for_existing_users");
  await recorder.save(testInfo);
});
