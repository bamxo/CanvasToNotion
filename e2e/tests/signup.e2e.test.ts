import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { E2ETestSetup, TestContext } from '../setup';

describe('User Signup E2E Tests', () => {
  let testSetup: E2ETestSetup;
  let context: TestContext;

  beforeEach(async () => {
    testSetup = new E2ETestSetup();
    context = await testSetup.setup();
  });

  afterEach(async () => {
    await testSetup.teardown();
  });

  it('should complete user signup and save to database', async () => {
    const { browser } = context;

    // Step 1: Open extension popup (should show LoginRedirect)
    const popupPage = await testSetup.openExtensionPopup(context);
    await popupPage.waitForSelector('body', { timeout: 10000 });

    // Step 2: Verify we're in unauthenticated state
    const signInButton = await popupPage.$('button');
    expect(signInButton).toBeTruthy();
    
    const buttonText = await signInButton!.evaluate(el => el.textContent || '');
    expect(buttonText.trim()).toBe('Sign In');

    // Step 3: Click Sign In to open webapp
    await signInButton!.click();
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 4: Find the webapp page that opened
    const pages = await browser.pages();
    const webappPage = pages.find(p => 
      p.url().includes('localhost:5173') || 
      p.url().includes('canvastonotion.io')
    );
    
    expect(webappPage).toBeTruthy();

    // Step 5: Simulate user signup on webapp
    if (webappPage) {
      // Wait for webapp to load
      await webappPage.waitForSelector('body', { timeout: 10000 });
      
      // Simulate setting an auth cookie (this is what the real webapp would do)
      await webappPage.setCookie({
        name: 'authToken',
        value: 'mock-firebase-token-12345',
        domain: 'localhost', // or 'canvastonotion.io' in production
        path: '/',
        httpOnly: false,
        secure: false
      });

      // Step 6: Test that extension detects the cookie
      // Open a new popup to trigger auth check
      const newPopupPage = await testSetup.openExtensionPopup(context);
      await newPopupPage.waitForSelector('body', { timeout: 10000 });

      // Wait for auth check to complete
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Step 7: Verify authentication state changed
      // Check if the popup now shows authenticated content or different state
      const newBodyText = await newPopupPage.evaluate(() => document.body.textContent || '');
      
      // The popup should either show different content or the extension should have
      // stored authentication data
      const authData = await newPopupPage.evaluate(() => {
        return new Promise(resolve => {
          chrome.storage.local.get(['canvasToken', 'userEmail', 'userId'], resolve);
        });
      });

      // At minimum, the auth cookie should trigger some change in storage or UI
      // This test may fail if the cookie auth isn't working, which is expected
      const hasAuthIndication = authData && (
        (authData as any).canvasToken || 
        (authData as any).userEmail || 
        !newBodyText.includes('Sign In')
      );

      // This assertion may fail - that's okay, it shows the real auth flow
      expect(hasAuthIndication).toBeTruthy();
    }
  }, 60000);
}); 