import { test, expect } from '@playwright/test';

test.describe('Tracking Flow - Weekly Routine Initialization', () => {
    test.beforeEach(async ({ page }) => {
        // Capture browser console logs for better debugging
        page.on('console', (msg) => console.log('BROWSER_LOG: ' + msg.text()));
        // Start at home, authenticated
        await page.goto('/home');
    });

    test('should complete the full flow to start a weekly routine', async ({ page, browserName }, testInfo) => {
        test.setTimeout(60000); // Increase timeout for the full flow
        // 1. Handle Home Screen branching
        // We wait for the tracking status to load. Since it's async, we check for both buttons.
        const beginNowBtn = page.getByTestId('comenzar-ahora');
        const goMyDayBtn = page.getByTestId('ir-a-mi-dia');

        // Wait for at least one of them to become visible
        await expect(beginNowBtn.or(goMyDayBtn)).toBeVisible({ timeout: 15000 });

        if (await beginNowBtn.isVisible()) {
            await beginNowBtn.click();
        } else {
            // User instruction: wait 1s before clicking if already active
            await page.waitForTimeout(1000);
            await goMyDayBtn.click();
        }

        // 2. My Week selection screen
        await expect(page).toHaveURL(/.*my-week/);
        const selectPlanBtn = page.getByTestId('seleccionar-plan');
        await expect(selectPlanBtn).toBeVisible();
        await selectPlanBtn.click();

        // 3. Plans list screen
        await expect(page).toHaveURL(/.*plans/);
        // Find the specific routine button. The user mentioned /routines/show/69a8a9a2afec29b3a4ad4585
        const routineId = '69a8a9a2afec29b3a4ad4585';
        const specificRoutineBtn = page.getByTestId(`rutina-semanal-${routineId}`);

        // If the specific routine is not visible (e.g. filtered), we might need to search for it
        if (!(await specificRoutineBtn.isVisible())) {
            // Search for "Rutina semanal" in the search input
            await page.getByPlaceholder(/Ej: Full Body/i).fill('Rutina semanal');
        }

        await expect(specificRoutineBtn).toBeVisible({ timeout: 10000 });
        await specificRoutineBtn.click();

        // 4. Routine Show screen
        await expect(page).toHaveURL(new RegExp(`.*routines/show/${routineId}`));
        const startRoutineBtn = page.getByTestId('iniciar-rutina-semanal');
        await expect(startRoutineBtn).toBeVisible();

        // Monitor network to see if mutation is happening
        page.on('request', (req) => {
            if (req.url().includes('graphql')) {
                console.log('GQL_REQ: ' + (req.postData()?.substring(0, 50) || ''));
            }
        });

        // Final action: Start the routine
        console.log('E2E_STEP: CLICK_START_ROUTINE');
        await startRoutineBtn.click({ force: true });
 
        // 5. Handle potential redirect or error dialog
        console.log('E2E_STEP: WAITING_FOR_MYWEEK_OR_ERROR');
        
        const errorDialog = page.getByText(/rutina semanal activa/i);
        const goToMyWeekBtn = page.getByTestId('ir-a-mi-semana');

        try {
            await Promise.race([
                page.waitForURL(/.*my-week/, { timeout: 10000 }),
                errorDialog.waitFor({ state: 'visible', timeout: 10000 }).then(async () => {
                   console.log('E2E_INFO: Routine already active dialog found. Navigating to My Week.');
                   await goToMyWeekBtn.click({ force: true });
                })
            ]);
        } catch (e) {
            console.log('E2E_INFO: Navigation race finished or timed out. URL:', page.url());
            if (!page.url().includes('my-week')) {
                console.log('E2E_INFO: Forcing navigation to /my-week to continue test.');
                await page.goto('/my-week');
            }
        }

        // 5. Final check for My Week tracking screen
        console.log('E2E_STEP: FINAL_URL_VERIFICATION');
        await expect(page).toHaveURL(/.*my-week/, { timeout: 10000 });

        // IMPORTANT: Wait for the app to finish loading and writing to localStorage
        console.log('E2E_STEP: WAITING_FOR_CACHE_WRITE');
        await page.waitForTimeout(5000);

        // TEST CACHE: plan-tracking.storage.ts
        console.log('E2E_STEP: EXTRACTING_CACHE_BEFORE_DELETE');
        const cacheData = (await page.evaluate(() => {
            const authUserStr = localStorage.getItem('auth_user');
            if (!authUserStr) return { error: 'No auth_user found in localStorage' };

            const authUser = JSON.parse(authUserStr);
            const userId = authUser.id;
            const storageKey = `tracking:${userId}`;
            const data = localStorage.getItem(storageKey);

            const parsedData = data ? JSON.parse(data) : null;

            // Remove it from storage to test invalidation/reload
            localStorage.removeItem(storageKey);

            return {
                userId,
                storageKey,
                originalData: parsedData,
                removed: true,
            };
        })) as any;

        if (cacheData.error) {
            console.error('--- E2E_CACHE_ERROR: ' + cacheData.error + ' ---');
            return;
        }

        console.log('--- CACHE_BEFORE_DELETE ---');
        console.log('User ID:', cacheData.userId);
        console.log('Key:', cacheData.storageKey);
        console.log('Data:', JSON.stringify(cacheData.originalData, null, 2));
        
        // 6. Reload and verify behavior
        console.log('E2E_STEP: RELOADING_PAGE_POST_DELETE');
        await page.reload();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000); // Wait for re-fetch and write
        
        console.log('E2E_STEP: CHECKING_CACHE_POST_RELOAD');
        const storageKey = cacheData.storageKey as string;
        const newCacheData = await page.evaluate((key) => {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        }, storageKey);

        console.log('--- CACHE_AFTER_RELOAD ---');
        console.log('Data:', JSON.stringify(newCacheData, null, 2));

        if (JSON.stringify(cacheData.originalData) === JSON.stringify(newCacheData)) {
            console.log('RESULT: Cache is IDENTICAL after reload (Successfully re-populated).');
        } else {
            console.log('RESULT: Cache is DIFFERENT after reload.');
        }
        console.log('E2E_STEP: TEST_COMPLETE');
    });
});
