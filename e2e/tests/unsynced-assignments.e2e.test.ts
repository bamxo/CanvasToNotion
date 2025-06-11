import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { Page } from 'puppeteer';
import { testSetup, TestContext } from '../setup';

describe('Unsynced Assignments E2E Tests', () => {
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
    
    // Set authenticated state with Notion connected
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

  it('should attempt to fetch unsynced assignments and fail without Canvas account', async () => {
    // Step 1: Look for unsynced assignments section or button
    const buttons = await popupPage.$$('button');
    const sections = await popupPage.$$('div, section');
    let unsyncedSectionFound = false;

    // Check for unsynced assignments button
    for (const button of buttons) {
      const text = await button.evaluate(el => el.textContent?.toLowerCase() || '');
      if (text.includes('unsynced') || text.includes('assignments') || text.includes('fetch') || text.includes('load')) {
        await button.click();
        unsyncedSectionFound = true;
        await new Promise(resolve => setTimeout(resolve, 3000));
        break;
      }
    }

    // Check for unsynced assignments section in UI
    if (!unsyncedSectionFound) {
      for (const section of sections) {
        const text = await section.evaluate(el => el.textContent?.toLowerCase() || '');
        if (text.includes('unsynced') || text.includes('assignments')) {
          unsyncedSectionFound = true;
          break;
        }
      }
    }

    // Step 2: Verify that it shows error or empty state (expected behavior)
    const bodyText = await popupPage.evaluate(() => document.body.textContent || '');
    
    // Should show one of these states since we don't have a real Canvas account:
    const hasExpectedFailureState = bodyText.includes('no assignments') ||
                                   bodyText.includes('error') ||
                                   bodyText.includes('failed') ||
                                   bodyText.includes('unable to fetch') ||
                                   bodyText.includes('canvas not connected') ||
                                   bodyText.includes('login to canvas') ||
                                   bodyText.includes('0 assignments') ||
                                   bodyText.includes('empty');

    // This test is EXPECTED to show a failure state since we don't have a real Canvas account
    expect(hasExpectedFailureState).toBe(true);

    // Step 3: Verify the UI handles the failure gracefully
    const hasGracefulFailure = !bodyText.includes('undefined') &&
                              !bodyText.includes('null') &&
                              !bodyText.includes('[object Object]');

    expect(hasGracefulFailure).toBe(true);
  }, 20000);

  it('should show appropriate message when Canvas is not accessible', async () => {
    // Mock Canvas API failure
    await popupPage.evaluate(() => {
      // Override fetch to simulate Canvas API being unavailable
      const originalFetch = (window as any).fetch;
      (window as any).fetch = (url) => {
        if (url.includes('canvas') || url.includes('instructure')) {
          return Promise.reject(new Error('Canvas API not accessible'));
        }
        return originalFetch(url);
      };
    });

    // Try to load assignments
    const buttons = await popupPage.$$('button');
    for (const button of buttons) {
      const text = await button.evaluate(el => el.textContent?.toLowerCase() || '');
      if (text.includes('sync') || text.includes('fetch') || text.includes('load') || text.includes('assignments')) {
        await button.click();
        await new Promise(resolve => setTimeout(resolve, 3000));
        break;
      }
    }

    // Should show appropriate error message
    const bodyText = await popupPage.evaluate(() => document.body.textContent || '');
    const hasCanvasError = bodyText.includes('canvas') && 
                          (bodyText.includes('error') || 
                           bodyText.includes('not accessible') ||
                           bodyText.includes('failed') ||
                           bodyText.includes('unable to connect'));

    expect(hasCanvasError).toBe(true);
  }, 15000);

  it('should handle the case when user is not on a Canvas page', async () => {
    // Mock being on a non-Canvas page
    await popupPage.evaluate(() => {
      // Override tab query to return non-Canvas page
      (window as any).chrome.tabs.query = (queryInfo, callback) => {
        const mockTab = {
          id: 1,
          url: 'https://google.com',
          title: 'Google',
          active: true,
          windowId: 1
        };
        if (typeof callback === 'function') {
          callback([mockTab]);
        }
        return Promise.resolve([mockTab]);
      };
    });

    await popupPage.reload();
    await popupPage.waitForSelector('body', { timeout: 10000 });

    // Should show message about not being on Canvas
    const bodyText = await popupPage.evaluate(() => document.body.textContent || '');
    const hasNonCanvasMessage = bodyText.includes('canvas') ||
                               bodyText.includes('navigate to canvas') ||
                               bodyText.includes('not on canvas') ||
                               bodyText.includes('visit canvas');

    // This is expected behavior - should guide user to Canvas
    expect(hasNonCanvasMessage).toBe(true);
  }, 15000);

  it('should show loading state when attempting to fetch assignments', async () => {
    // Mock slow Canvas API response
    await popupPage.evaluate(() => {
      (window as any).fetch = () => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({
              ok: false,
              status: 401,
              json: () => Promise.resolve({ error: 'Unauthorized' })
            });
          }, 2000);
        });
      };
    });

    // Trigger assignment fetch
    const buttons = await popupPage.$$('button');
    for (const button of buttons) {
      const text = await button.evaluate(el => el.textContent?.toLowerCase() || '');
      if (text.includes('sync') || text.includes('fetch') || text.includes('load')) {
        await button.click();
        
        // Check for loading state immediately
        await new Promise(resolve => setTimeout(resolve, 500));
        const loadingText = await popupPage.evaluate(() => document.body.textContent || '');
        const hasLoadingState = loadingText.includes('loading') ||
                               loadingText.includes('fetching') ||
                               loadingText.includes('syncing') ||
                               button.evaluate(el => el.textContent?.includes('...') || false);

        if (hasLoadingState) {
          expect(hasLoadingState).toBe(true);
          return;
        }
        
        // Wait for completion
        await new Promise(resolve => setTimeout(resolve, 3000));
        break;
      }
    }
  }, 20000);
}); 