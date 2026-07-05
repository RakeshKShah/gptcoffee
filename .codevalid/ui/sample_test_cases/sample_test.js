/**
 * Sample Playwright test for GPT Coffee UI.
 *
 * Tests the login flow and verifies the coffee menu loads for a buyer.
 * Uses the mock server (started via globalSetup or webServer) at port 4100,
 * and the Vite dev server for the UI at port 5174.
 *
 * Acceptance criteria: CV-001 - User can view the GPT Coffee menu after login.
 */

import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../helpers/execution-recorder.js";

const BUYER_EMAIL = "buyer@gptcoffee.test";
const BUYER_PASSWORD = "buyer123";

test("CV-001 - buyer can log in and view the coffee menu", async ({
  page,
}, testInfo) => {
  const recorder = new ExecutionRecorder("CV-001", "buyer can log in and view the coffee menu");

  await recorder.step("Navigate to the app", async () => {
    await page.goto("/");
  });

  await recorder.step("Verify auth screen is displayed", async () => {
    await expect(page.getByText("GPT Coffee")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Login")).toBeVisible();
  });

  await recorder.step("Fill in buyer credentials", async () => {
    await page.getByLabel("Email").fill(BUYER_EMAIL);
    await page.getByLabel("Password").fill(BUYER_PASSWORD);
  });

  await recorder.step("Submit the login form", async () => {
    await page.getByRole("button", { name: /login/i }).click();
  });

  await recorder.step("Verify the menu is visible after login", async () => {
    // After login the buyer app loads the menu with coffee products
    await expect(page.getByText("Signature drinks")).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByText("Velvet Latte")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Midnight Mocha")).toBeVisible({
      timeout: 10000,
    });
  });

  recorder.record("Test completed", { status: "passed" });
  await recorder.save(testInfo);
});

test("CV-002 - login page shows sample credential cards", async ({
  page,
}, testInfo) => {
  const recorder = new ExecutionRecorder(
    "CV-002",
    "login page shows sample credential cards"
  );

  await recorder.step("Navigate to the app", async () => {
    await page.goto("/");
  });

  await recorder.step("Verify credential helper cards are present", async () => {
    await expect(page.getByText("Sample buyer")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Sample admin")).toBeVisible({ timeout: 5000 });
  });

  await recorder.step("Use the sample buyer card to pre-fill form", async () => {
    await page.getByText("Sample buyer").click();
    const emailInput = page.getByLabel("Email");
    await expect(emailInput).toHaveValue(BUYER_EMAIL);
  });

  recorder.record("Test completed", { status: "passed" });
  await recorder.save(testInfo);
});
