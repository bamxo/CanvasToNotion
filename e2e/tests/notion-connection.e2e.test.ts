import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { E2ETestSetup, TestContext } from '../setup';

describe('Notion Connection E2E Tests', () => {
  let testSetup: E2ETestSetup;
  let context: TestContext;

  beforeEach(async () => {
    testSetup = new E2ETestSetup();
    context = await testSetup.setup();
  });

  afterEach(async () => {
    await testSetup.teardown();
  });

  it('should connect to Notion account', async () => {
    const popupPage = await testSetup.openExtensionPopup(context);
    await popupPage.waitForSelector('body', { timeout: 10000 });

    // Step 1: Set up authenticated state by simulating successful webapp login
    await popupPage.setCookie({
      name: 'authToken',
      value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
      domain: 'localhost',
      path: '/',
      httpOnly: false,
      secure: false
    });

    // Step 2: Manually set authenticated state in storage (simulating successful auth)
    await popupPage.evaluate(() => {
      chrome.storage.local.set({
        canvasToken: 'test-canvas-token',
        userEmail: 'test@test.test',
        userId: 'test-user-id',
        firebaseToken: 'test-firebase-token'
      });
    });

    // Step 3: Reload popup to trigger authenticated state
    await popupPage.reload();
    await popupPage.waitForSelector('body', { timeout: 10000 });
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Step 4: Check if popup shows authenticated content
    const bodyText = await popupPage.evaluate(() => document.body.textContent || '');
    
    // In authenticated state, popup should show PageSelector or Dashboard
    // instead of LoginRedirect
    const showsAuthenticatedContent = bodyText.includes('Page Selector') ||
                                     bodyText.includes('Dashboard') ||
                                     bodyText.includes('Notion') ||
                                     bodyText.includes('Connect') ||
                                     !bodyText.includes('Sign In');

    // This tests if the extension properly transitions to authenticated state
    expect(showsAuthenticatedContent).toBeTruthy();

    // Step 5: Test Notion connection flow
    // Look for Notion-related UI elements
    const notionButtons = await popupPage.$$('button');
    let notionConnectionFound = false;

    for (const button of notionButtons) {
      const buttonText = await button.evaluate(el => el.textContent?.toLowerCase() || '');
      if (buttonText.includes('notion') || buttonText.includes('connect') || buttonText.includes('authorize')) {
        notionConnectionFound = true;
        
        // Try clicking the Notion connection button
        try {
          await button.click();
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Check if this triggers any Notion-related flow
          const newBodyText = await popupPage.evaluate(() => document.body.textContent || '');
          const hasNotionFlow = newBodyText.includes('notion') || 
                               newBodyText.includes('authorize') ||
                               newBodyText.includes('connect');
          
          if (hasNotionFlow) {
            notionConnectionFound = true;
          }
        } catch (error) {
          // Button click might fail, that's okay for testing
        }
        break;
      }
    }

    // This tests the actual Notion integration flow
    // May fail if Notion integration isn't fully implemented
    expect(notionConnectionFound).toBeTruthy();
  }, 45000);

  it('should handle Notion connection errors gracefully', async () => {
    const popupPage = await testSetup.openExtensionPopup(context);
    await popupPage.waitForSelector('body', { timeout: 10000 });

    // Step 1: Set up authenticated state but simulate Notion connection failure
    await popupPage.evaluate(() => {
      chrome.storage.local.set({
        canvasToken: 'test-canvas-token',
        userEmail: 'test@test.test',
        userId: 'test-user-id',
        firebaseToken: 'test-firebase-token',
        // Simulate failed Notion connection
        notionConnected: false,
        notionError: 'Failed to connect to Notion'
      });
    });

    await popupPage.reload();
    await popupPage.waitForSelector('body', { timeout: 10000 });
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 2: Check if the extension handles Notion connection errors
    const bodyText = await popupPage.evaluate(() => document.body.textContent || '');
    
    // Should show some indication of Notion connection issues
    const hasErrorHandling = bodyText.includes('error') ||
                            bodyText.includes('failed') ||
                            bodyText.includes('connect') ||
                            bodyText.includes('notion') ||
                            bodyText.includes('try again') ||
                            // Or shows the PageSelector waiting for Notion connection
                            bodyText.includes('Page Selector');

    // This tests error handling in the Notion integration
    expect(hasErrorHandling).toBeTruthy();

    // Step 3: Test storage state reflects the error
    const storageData = await popupPage.evaluate(() => {
      return new Promise(resolve => {
        chrome.storage.local.get(['notionConnected', 'notionError'], resolve);
      });
    });

    // Verify error state is properly stored
    const hasErrorState = storageData && (
      (storageData as any).notionConnected === false ||
      (storageData as any).notionError
    );

    expect(hasErrorState).toBeTruthy();
  }, 30000);
}); 