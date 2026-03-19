import { test, expect } from '@playwright/test';

test('Comprehensive User Journey: Setup, Multi-Module Data Entry, and Cleanup', async ({ page }) => {
  const isCI = process.env.VITE_CI === 'true';
  const testEmail = isCI ? 'test@example.com' : `test_${Date.now()}@example.com`;
  const testPassword = 'Password123!';

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
  await expect(page.getByTestId('page-header')).toHaveText('Portal', { timeout: 45000 });

  // 2. Actions Module: Add an Objective
  await page.getByRole('button', { name: 'Actions', exact: true }).click();
  await page.getByRole('button', { name: 'Objectives', exact: true }).click();
  const objectiveInput = page.getByPlaceholder('New Objective...');
  await objectiveInput.fill('Master the Portal E2E');
  await page.getByRole('button', { name: 'Add Objective' }).click();
  // Verify data presence (most robust check)
  await expect(page.getByText('Master the Portal E2E')).toBeVisible({ timeout: 15000 });

  // 3. Journal Module: Add an Entry
  await page.getByRole('button', { name: 'Journal', exact: true }).click();
  const journalInput = page.getByPlaceholder('New update...');
  await journalInput.fill('Automated journey testing in progress.');
  await page.getByRole('button', { name: 'Add Log Entry' }).click();
  await expect(page.getByText('Automated journey testing in progress.')).toBeVisible({ timeout: 15000 });

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
  
  await page.getByPlaceholder('New Item...').fill('Test Revenue');
  const amountInput = page.getByPlaceholder('0');
  await amountInput.fill('5000');
  await page.getByRole('button', { name: 'Add Ledger Item' }).click();
  await expect(page.getByText('Test Revenue')).toBeVisible({ timeout: 15000 });

  // 5. Food Module: Add Culinary Standing
  await page.getByRole('button', { name: 'Food', exact: true }).click();
  await page.getByRole('button', { name: 'Culinary Standings', exact: true }).click();
  await page.getByRole('button', { name: 'New Category', exact: true }).click();
  await page.getByPlaceholder('Category (e.g. Reubens, Best Burgers)').fill('Sushi');
  await page.getByRole('button', { name: 'Create Standings' }).click();
  // Verify category creation
  await expect(page.getByRole('button', { name: 'Sushi' })).toBeVisible({ timeout: 15000 });

  // 6. Cleanup: Prune and Sign Out
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  
  // Listen for the dialog and accept it
  page.on('dialog', dialog => dialog.accept());
  
  const purgeBtn = page.getByRole('button', { name: 'Execute Purge' });
  await purgeBtn.scrollIntoViewIfNeeded();
  await purgeBtn.click();

  // Wait for automatic sign-out after purge
  await expect(page.getByRole('button', { name: 'Authenticate' })).toBeVisible({ timeout: 20000 });
});
