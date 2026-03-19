/* eslint-env node */
import { test, expect } from '@playwright/test';

test('Comprehensive User Journey: Setup, Multi-Module Data Entry, and Cleanup', async ({ page }) => {
  const isCI = process.env.VITE_CI === 'true';
  const testEmail = isCI ? 'therealdannybrown+test@gmail.com' : `test_${Date.now()}@example.com`;
  const testPassword = isCI ? 'H9sa5jmssAc7eMa' : 'Password123!';

  // 1. Setup: Navigate and Authenticate
  await page.goto('/?test_mode=true');
  
  // In CI, we try to login first because signup might require email confirmation on remote DB
  await page.getByPlaceholder('Identity Email').fill(testEmail);
  await page.getByPlaceholder('Access Key').fill(testPassword);
  await page.getByRole('button', { name: 'Authenticate' }).click();

  // If login fails (or we are local), try signup
  const errorMsg = page.locator('.bg-red-500');
  if (await errorMsg.isVisible({ timeout: 5000 }).catch(() => false) || !isCI) {
    await page.getByRole('button', { name: 'Request New Access' }).click();
    await page.getByPlaceholder('Identity Email').fill(testEmail);
    await page.getByPlaceholder('Access Key').fill(testPassword);
    await page.getByRole('button', { name: 'Register Identity' }).click();
  }

  // Wait for Dashboard - more patient wait for remote DB
  try {
    await expect(page.getByTestId('page-header')).toHaveText('Portal', { timeout: 45000 });
  } catch (e) {
    // Diagnostic: If we failed to find the portal header, are we still on the auth page?
    const isAuthVisible = await page.getByTestId('auth-page').isVisible();
    if (isAuthVisible) {
      const pageText = await page.innerText('body');
      throw new Error(`Test failed to reach Dashboard. Still on Auth page. Current text: ${pageText.substring(0, 200)}...`);
    }
    throw e;
  }

  // 2. Actions Module: Add an Objective
  const runId = Date.now();
  const objectiveTitle = `Master the Portal E2E - ${runId}`;
  
  await page.getByRole('button', { name: 'Actions', exact: true }).click();
  // Ensure sub-navigation is visible before clicking
  const objectivesBtn = page.getByRole('button', { name: 'Objectives', exact: true });
  await expect(objectivesBtn).toBeVisible({ timeout: 15000 });
  await objectivesBtn.click();
  
  const objectiveInput = page.getByPlaceholder('New Objective...');
  await expect(objectiveInput).toBeVisible({ timeout: 15000 });
  await objectiveInput.fill(objectiveTitle);
  await page.getByLabel('Add Objective').click();
  // Wait for the network to settle to ensure the save is complete
  await page.waitForLoadState('networkidle');
  // Verify data presence (most robust check)
  await expect(page.getByText(objectiveTitle)).toBeVisible({ timeout: 20000 });

  // 3. Journal Module: Add an Entry
  const journalText = `Automated journey testing in progress. ID: ${runId}`;
  await page.getByRole('button', { name: 'Journal', exact: true }).click();
  const journalInput = page.getByPlaceholder('New update...');
  await journalInput.fill(journalText);
  await page.getByRole('button', { name: 'Add Log Entry' }).click();
  await expect(page.getByText(journalText)).toBeVisible({ timeout: 15000 });

  // 4. Money Module: Start Ledger
  await page.getByRole('button', { name: 'Money', exact: true }).click();
  await page.getByRole('button', { name: 'Ledger', exact: true }).click();
  
  // Wait for either the start button or the input field to appear
  const startBtn = page.getByRole('button', { name: 'Start First Week' });
  if (await startBtn.isVisible({ timeout: 15000 }).catch(() => false)) {
    await startBtn.click();
    // Wait for auto-population logic to complete
    await page.waitForTimeout(2000);
  }
  
  const revenueTitle = `Test Revenue - ${runId}`;
  await page.getByPlaceholder('New Item...').fill(revenueTitle);
  const amountInput = page.getByPlaceholder('0');
  await amountInput.fill('5000');
  await page.getByRole('button', { name: 'Add Ledger Item' }).click();
  await expect(page.getByText(revenueTitle)).toBeVisible({ timeout: 15000 });

  // 5. Food Module: Add Culinary Standing
  const foodCategory = `Sushi - ${runId}`;
  await page.getByRole('button', { name: 'Food', exact: true }).click();
  await page.getByRole('button', { name: 'Culinary Standings', exact: true }).click();
  await page.getByRole('button', { name: 'New Category', exact: true }).click();
  await page.getByPlaceholder('Category (e.g. Reubens, Best Burgers)').fill(foodCategory);
  await page.getByRole('button', { name: 'Create Standings' }).click();
  // Verify category creation
  await expect(page.getByRole('button', { name: foodCategory })).toBeVisible({ timeout: 15000 });

  // 6. Cleanup: Sign Out (Skip purge for CI user to keep account active)
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  
  if (!isCI) {
    // Locally, we still purge to keep the DB clean
    page.on('dialog', dialog => dialog.accept());
    const purgeBtn = page.getByRole('button', { name: 'Execute Purge' });
    await purgeBtn.scrollIntoViewIfNeeded();
    await purgeBtn.click();
  } else {
    // In CI, just sign out so we don't delete the verified user
    // Resolve ambiguity by using exact: true for the sidebar sign out button
    const signOutBtn = page.getByRole('button', { name: 'Sign Out', exact: true });
    if (await signOutBtn.isVisible()) {
        await signOutBtn.click();
    }
  }

  // Wait for automatic sign-out
  await expect(page.getByTestId('auth-page')).toBeVisible({ timeout: 20000 });
});
