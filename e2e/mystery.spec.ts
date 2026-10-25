import { test, expect } from '@playwright/test';

test.describe('AI Mystery Room E2E Flow (Mock Mode)', () => {
  test('Complete Easy Mystery: Home -> Create -> Investigate -> Accuse -> Result', async ({ page }) => {
    // 1. Visit Home Page
    await page.goto('/');
    await expect(page).toHaveTitle(/AI Mystery Room/i);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Solve a mystery/i);

    // 2. Click "Start a Mystery" CTA to navigate to /create
    const startBtn = page.locator('main').getByRole('link', { name: /Start a Mystery/i });
    await startBtn.click();
    await expect(page).toHaveURL(/\/create/);
    await expect(page.getByRole('heading', { name: /CREATE YOUR/i })).toBeVisible();

    // 3. Select Easy sample premise ("A Missing Professor")
    const easySampleChip = page.getByRole('button', { name: /A Missing Professor/i }).first();
    await easySampleChip.click();

    // 4. Submit Create Mystery Form
    const generateBtn = page.getByRole('button', { name: /Generate Mystery/i });
    await expect(generateBtn).toBeEnabled();
    await generateBtn.click();

    // 5. Lands on Case / Generating Page
    await expect(page).toHaveURL(/\/case\/[a-zA-Z0-9_-]+/);

    // 6. Wait for Case Board to be active
    await expect(page.getByText('Official Crime Dossier')).toBeVisible({ timeout: 15000 });

    // Switch to clues tab on mobile if needed
    const mobileCluesTab = page.getByTestId('mobile-tab-clues');
    if (await mobileCluesTab.isVisible()) {
      await mobileCluesTab.click();
      await page.waitForTimeout(300);
    }

    // 7. Investigate clues to reach accusation threshold
    for (let i = 0; i < 4; i++) {
      const btn = page.getByRole('button', { name: /Investigate Clue/i }).first();
      if (await btn.isVisible()) {
        await btn.click();
        await page.waitForTimeout(600);

        // Close any clue detail modal that might pop open
        const closeBtn = page.getByRole('button', { name: /Close clue details/i });
        if (await closeBtn.isVisible()) {
          await closeBtn.click();
          await page.waitForTimeout(300);
        }
      }
    }

    // 8. Accuse Culprit
    const accuseBtn = page.getByRole('button', { name: /Accuse Culprit/i }).first();
    await expect(accuseBtn).toBeEnabled({ timeout: 10000 });
    await accuseBtn.click();

    // 9. Accusation Modal Interaction
    await expect(page.getByRole('heading', { name: /Final Accusation/i })).toBeVisible();
    
    // Pick the first available suspect
    const suspectChoice = page.locator('[role="dialog"]').getByRole('heading', { level: 4 }).first();
    await suspectChoice.click();

    // Review step
    const reviewBtn = page.getByRole('button', { name: /Review Accusation/i });
    await reviewBtn.click();

    // Confirm step
    const confirmBtn = page.getByRole('button', { name: /Confirm Accusation/i });
    await confirmBtn.click();

    // 10. Arrive at Result Page
    await expect(page).toHaveURL(/\/case\/[a-zA-Z0-9_-]+\/result/, { timeout: 15000 });
    await expect(page.getByText('Investigative Score Sheet')).toBeVisible();
    await expect(page.getByText('The Confession & True Crime')).toBeVisible();
  });

  test('Medium Mystery Flow with Hint Drawer', async ({ page }) => {
    // 1. Direct navigation with sample-1 preset (Medium)
    await page.goto('/create?sample=sample-1');
    await expect(page.getByRole('button', { name: /Generate Mystery/i })).toBeEnabled();
    await page.getByRole('button', { name: /Generate Mystery/i }).click();

    // 2. Wait for Case Board
    await expect(page).toHaveURL(/\/case\/[a-zA-Z0-9_-]+/);
    await expect(page.getByText('Official Crime Dossier')).toBeVisible({ timeout: 15000 });

    // Switch to clues tab on mobile if needed
    const mobileCluesTab = page.getByTestId('mobile-tab-clues');
    if (await mobileCluesTab.isVisible()) {
      await mobileCluesTab.click();
      await expect(page.getByText(/Crime Scene Evidence/i)).toBeVisible();
    }

    // 3. Investigate at least 1 clue so hint 1 unlocks
    const firstInvestigateBtn = page.getByRole('button', { name: /Investigate Clue/i }).first();
    if (await firstInvestigateBtn.isVisible()) {
      await firstInvestigateBtn.click();
      await page.waitForTimeout(600);

      // Close detail modal if opened
      const closeDetail = page.getByRole('button', { name: /Close clue details/i });
      if (await closeDetail.isVisible()) {
        await closeDetail.click();
        await page.waitForTimeout(300);
      }
    }

    // 4. Open Hint Drawer
    const hintTrigger = page.getByRole('button', { name: /Hints \(/i }).first();
    await hintTrigger.click();
    await expect(page.getByRole('heading', { name: /Case Hints/i })).toBeVisible();

    // 5. Close Hint Drawer
    const closeDrawer = page.getByRole('button', { name: /Close hint drawer/i });
    await closeDrawer.click();
  });

  test('Static & Archive Pages Navigation', async ({ page }) => {
    // 1. How it works
    await page.goto('/how-it-works');
    await expect(page.getByRole('heading', { name: /How The Mystery Works/i })).toBeVisible();
    await expect(page.getByText('Difficulty Tier & Scoring Matrix')).toBeVisible();

    // 2. About page
    await page.goto('/about');
    await expect(page.getByRole('heading', { name: /About AI Mystery Room/i })).toBeVisible();
    await expect(page.getByText('Zero-Leak Secrecy Architecture')).toBeVisible();

    // 3. Cases Archive
    await page.goto('/cases');
    await expect(page.getByRole('heading', { name: /Detective Case Archive/i })).toBeVisible();
  });
});
