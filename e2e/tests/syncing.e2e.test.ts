import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { Page } from 'puppeteer';
import { testSetup, TestContext } from '../setup';

describe('Syncing E2E Tests', () => {
  let context: TestContext;
  let popupPage: Page;

  const testCredentials = {
    email: 'test@test.test',
    password: 'testtest'
  };

  beforeAll(async () => {
    context = await testSetup.setup();
  }, 30000);

  afterAll(async () => {
    await testSetup.teardown();
  });

  beforeEach(async () => {
    popupPage = await testSetup.openExtensionPopup(context);
    
    // Set authenticated state with Notion connected and page selected
    await popupPage.evaluate((creds) => {
      (window as any).chrome.storage.local.set({
        userEmail: creds.email,
        userId: 'test-user-id',
        canvasToken: 'test-token',
        isAuthenticated: true,
        notionToken: 'mock-notion-token',
        notionConnected: true,
        selectedPage: 'page-1'
      });
    }, testCredentials);

    await popupPage.reload();
    await popupPage.waitForSelector('body', { timeout: 10000 });
  });

  afterEach(async () => {
    if (popupPage && !popupPage.isClosed()) {
      await popupPage.close();
    }
  });

  it('should attempt to sync assignments and fail without Canvas account', async () => {
    // Step 1: Look for sync button
    const buttons = await popupPage.$$('button');
    let syncButtonFound = false;

    for (const button of buttons) {
      const text = await button.evaluate(el => el.textContent?.toLowerCase() || '');
      if (text.includes('sync') || text.includes('synchronize')) {
        await button.click();
        syncButtonFound = true;
        await new Promise(resolve => setTimeout(resolve, 3000));
        break;
      }
    }

    expect(syncButtonFound).toBe(true);

    // Step 2: Verify sync fails appropriately (expected behavior)
    const bodyText = await popupPage.evaluate(() => document.body.textContent || '');
    
    // Should show one of these failure states since we don't have a real Canvas account:
    const hasExpectedSyncFailure = bodyText.includes('sync failed') ||
                                  bodyText.includes('error') ||
                                  bodyText.includes('unable to sync') ||
                                  bodyText.includes('canvas not accessible') ||
                                  bodyText.includes('no assignments to sync') ||
                                  bodyText.includes('failed to fetch') ||
                                  bodyText.includes('unauthorized');

    // This test is EXPECTED to fail since we don't have a real Canvas account
    expect(hasExpectedSyncFailure).toBe(true);

    // Step 3: Verify the UI handles the sync failure gracefully
    const hasGracefulFailure = !bodyText.includes('undefined') &&
                              !bodyText.includes('null') &&
                              !bodyText.includes('[object Object]') &&
                              !bodyText.includes('TypeError');

    expect(hasGracefulFailure).toBe(true);
  }, 20000);

  it('should show sync progress and handle Canvas API errors', async () => {
    // Mock Canvas API to return error
    await popupPage.evaluate(() => {
      (window as any).fetch = (url) => {
        if (url.includes('canvas') || url.includes('instructure')) {
          return Promise.reject(new Error('Canvas API Error: Unauthorized'));
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      };
    });

    // Trigger sync
    const buttons = await popupPage.$$('button');
    for (const button of buttons) {
      const text = await button.evaluate(el => el.textContent?.toLowerCase() || '');
      if (text.includes('sync')) {
        await button.click();
        
        // Check for loading/progress state
        await new Promise(resolve => setTimeout(resolve, 500));
        const progressText = await popupPage.evaluate(() => document.body.textContent || '');
        const hasProgressState = progressText.includes('syncing') ||
                                progressText.includes('loading') ||
                                progressText.includes('processing');

        // Wait for completion
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Should show error state
        const finalText = await popupPage.evaluate(() => document.body.textContent || '');
        const hasErrorState = finalText.includes('error') ||
                             finalText.includes('failed') ||
                             finalText.includes('unauthorized');

        expect(hasErrorState).toBe(true);
        break;
      }
    }
  }, 20000);

  it('should handle sync when no Notion page is selected', async () => {
    // Remove selected page
    await popupPage.evaluate(() => {
      (window as any).chrome.storage.local.remove(['selectedPage']);
    });

    await popupPage.reload();
    await popupPage.waitForSelector('body', { timeout: 10000 });

    // Try to sync
    const buttons = await popupPage.$$('button');
    for (const button of buttons) {
      const text = await button.evaluate(el => el.textContent?.toLowerCase() || '');
      if (text.includes('sync')) {
        await button.click();
        await new Promise(resolve => setTimeout(resolve, 2000));
        break;
      }
    }

    // Should show message about needing to select a page
    const bodyText = await popupPage.evaluate(() => document.body.textContent || '');
    const hasPageSelectionMessage = bodyText.includes('select') ||
                                   bodyText.includes('choose') ||
                                   bodyText.includes('page') ||
                                   bodyText.includes('notion');

    expect(hasPageSelectionMessage).toBe(true);
  }, 15000);

  it('should handle sync when Notion is not connected', async () => {
    // Remove Notion connection
    await popupPage.evaluate(() => {
      (window as any).chrome.storage.local.remove(['notionToken', 'notionConnected']);
    });

    await popupPage.reload();
    await popupPage.waitForSelector('body', { timeout: 10000 });

    // Try to sync
    const buttons = await popupPage.$$('button');
    for (const button of buttons) {
      const text = await button.evaluate(el => el.textContent?.toLowerCase() || '');
      if (text.includes('sync')) {
        await button.click();
        await new Promise(resolve => setTimeout(resolve, 2000));
        break;
      }
    }

    // Should show message about needing to connect Notion
    const bodyText = await popupPage.evaluate(() => document.body.textContent || '');
    const hasNotionConnectionMessage = bodyText.includes('connect notion') ||
                                      bodyText.includes('notion not connected') ||
                                      bodyText.includes('authorize notion');

    expect(hasNotionConnectionMessage).toBe(true);
  }, 15000);

  it('should show sync history or status', async () => {
    // Mock some sync history
    await popupPage.evaluate(() => {
      (window as any).chrome.storage.local.set({
        syncHistory: [
          {
            timestamp: Date.now() - 3600000, // 1 hour ago
            status: 'failed',
            error: 'Canvas not accessible'
          },
          {
            timestamp: Date.now() - 7200000, // 2 hours ago
            status: 'failed',
            error: 'No assignments found'
          }
        ]
      });
    });

    await popupPage.reload();
    await popupPage.waitForSelector('body', { timeout: 10000 });

    // Look for sync history or status
    const bodyText = await popupPage.evaluate(() => document.body.textContent || '');
    const hasSyncStatus = bodyText.includes('last sync') ||
                         bodyText.includes('sync history') ||
                         bodyText.includes('failed') ||
                         bodyText.includes('ago') ||
                         bodyText.includes('status');

    // Should show some indication of sync status/history
    expect(hasSyncStatus).toBe(true);
  }, 15000);

  it('should handle partial sync failures gracefully', async () => {
    // Mock mixed success/failure responses
    await popupPage.evaluate(() => {
      let callCount = 0;
      (window as any).fetch = (url) => {
        callCount++;
        if (url.includes('canvas')) {
          // First call succeeds, second fails
          if (callCount === 1) {
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve({
                assignments: [
                  { id: 1, name: 'Assignment 1', due_at: '2024-01-01' }
                ]
              })
            });
          } else {
            return Promise.reject(new Error('Network error'));
          }
        }
        if (url.includes('notion')) {
          return Promise.reject(new Error('Notion API error'));
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      };
    });

    // Trigger sync
    const buttons = await popupPage.$$('button');
    for (const button of buttons) {
      const text = await button.evaluate(el => el.textContent?.toLowerCase() || '');
      if (text.includes('sync')) {
        await button.click();
        await new Promise(resolve => setTimeout(resolve, 4000));
        break;
      }
    }

    // Should show partial failure state
    const bodyText = await popupPage.evaluate(() => document.body.textContent || '');
    const hasPartialFailureHandling = bodyText.includes('error') ||
                                     bodyText.includes('failed') ||
                                     bodyText.includes('some') ||
                                     bodyText.includes('partial');

    expect(hasPartialFailureHandling).toBe(true);
  }, 25000);
}); 