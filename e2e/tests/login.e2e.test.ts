import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { E2ETestSetup, TestContext } from '../setup';

describe('Extension Login E2E Tests', () => {
  let testSetup: E2ETestSetup;
  let context: TestContext;

  beforeEach(async () => {
    testSetup = new E2ETestSetup();
    context = await testSetup.setup();
  });

  afterEach(async () => {
    await testSetup.teardown();
  });

  it('should login to extension from webapp', async () => {
    const { browser } = context;

    // Step 1: Simulate user already logged into webapp by setting auth cookie
    const pages = await browser.pages();
    const mainPage = pages[0];
    
    // Set the auth cookie that the webapp would set after login
    await mainPage.setCookie({
      name: 'authToken',
      value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
      domain: 'localhost',
      path: '/',
      httpOnly: false,
      secure: false
    });

    // Step 2: Open extension popup
    const popupPage = await testSetup.openExtensionPopup(context);
    await popupPage.waitForSelector('body', { timeout: 10000 });

    // Step 3: Wait for the extension to check for cookie authentication
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Step 4: Check if the extension detected the auth cookie and updated storage
    const authData = await popupPage.evaluate(() => {
      return new Promise(resolve => {
        chrome.storage.local.get([
          'firebaseToken', 
          'canvasToken', 
          'userEmail', 
          'userId',
          'tokenTimestamp'
        ], resolve);
      });
    });

    // Step 5: Verify authentication data was stored
    const hasAuthData = authData && (
      (authData as any).firebaseToken || 
      (authData as any).canvasToken ||
      (authData as any).userEmail
    );

    // This test verifies the real cookie-based auth flow
    // It may fail if the cookie auth mechanism isn't working properly
    expect(hasAuthData).toBeTruthy();

    // Step 6: Check if popup UI changed to reflect authenticated state
    const bodyText = await popupPage.evaluate(() => document.body.textContent || '');
    
    // If authenticated, popup should not show "Sign In" button anymore
    // or should show different content (PageSelector, Dashboard, etc.)
    const showsAuthenticatedState = !bodyText.includes('Sign In') || 
                                   bodyText.includes('Page Selector') ||
                                   bodyText.includes('Dashboard') ||
                                   bodyText.includes('Canvas assignments');

    // This assertion tests if the UI reflects the authenticated state
    expect(showsAuthenticatedState).toBeTruthy();
  }, 45000);

  it('should handle CHECK_AUTH message correctly', async () => {
    const popupPage = await testSetup.openExtensionPopup(context);
    await popupPage.waitForSelector('body', { timeout: 10000 });

    // Step 1: Test the CHECK_AUTH message that the extension uses
    const authResponse = await popupPage.evaluate(() => {
      return new Promise(resolve => {
        chrome.runtime.sendMessage({ type: 'CHECK_AUTH' }, (response) => {
          resolve(response);
        });
      });
    });

    // Step 2: Verify the response structure
    expect(authResponse).toBeDefined();
    expect(typeof (authResponse as any)?.isAuthenticated).toBe('boolean');

    // Step 3: Test with a mock auth cookie
    await popupPage.setCookie({
      name: 'authToken',
      value: 'test-token-value',
      domain: 'localhost',
      path: '/',
      httpOnly: false,
      secure: false
    });

    // Wait for cookie to be processed
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 4: Check auth again after setting cookie
    const authResponseWithCookie = await popupPage.evaluate(() => {
      return new Promise(resolve => {
        chrome.runtime.sendMessage({ type: 'CHECK_AUTH' }, (response) => {
          resolve(response);
        });
      });
    });

    // This tests the actual message passing mechanism
    expect(authResponseWithCookie).toBeDefined();
  }, 30000);
}); 