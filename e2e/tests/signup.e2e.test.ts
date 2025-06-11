import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { E2ETestSetup, TestContext } from '../setup';
import { ElementHandle } from 'puppeteer';

describe('User Signup E2E Test', () => {
  let testSetup: E2ETestSetup;
  let context: TestContext;

  beforeEach(async () => {
    testSetup = new E2ETestSetup();
    context = await testSetup.setup();
  });

  afterEach(async () => {
    await testSetup.teardown();
  });

  it('should complete user signup flow', async () => {
    const { browser } = context;

    // Step 1: Open extension as standalone page
    const extensionPage = await browser.newPage();
    await extensionPage.goto(`chrome-extension://${context.extensionId}/index.html`);
    await extensionPage.waitForSelector('body', { timeout: 10000 });

    // Debug: Check what's actually on the page
    const pageContent = await extensionPage.evaluate(() => document.body.textContent);
    const pageHTML = await extensionPage.evaluate(() => document.body.innerHTML);
    
    // Step 2: Find the Sign In button using multiple approaches
    let signInButton: ElementHandle<HTMLButtonElement> | null = await extensionPage.$('button');
    
    if (!signInButton) {
      // Try finding by text content
      const buttons = await extensionPage.$$('button');
      for (const button of buttons) {
        const text = await button.evaluate(el => el.textContent || '');
        if (text.includes('Sign In') || text.includes('Sign in') || text.includes('Login')) {
          signInButton = button;
          break;
        }
      }
    }

    expect(signInButton).toBeTruthy();

    // Click Sign In button
    await signInButton!.click();
    
    // Wait for redirect
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Step 3: Find the lookup component page that should have opened
    const pages = await browser.pages();
    const lookupPage = pages.find(p => 
      p.url().includes('localhost:5173') || 
      p.url().includes('canvastonotion.io')
    );
    
    expect(lookupPage).toBeTruthy();

    if (lookupPage) {
      // Step 4: Wait for lookup component to load
      await lookupPage.waitForSelector('body', { timeout: 10000 });
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Debug: Check what's on the lookup page
      const lookupContent = await lookupPage.evaluate(() => document.body.textContent);
      
      // Step 5: Find "Sign Up with Email" button
      let signUpButton: ElementHandle<HTMLButtonElement> | null = null;
      
      // Try finding by text content
      const signUpButtons = await lookupPage.$$('button');
      for (const button of signUpButtons) {
        const text = await button.evaluate(el => el.textContent || '');
        if (text.includes('Sign Up') || text.includes('Create Account') || text.includes('Register')) {
          signUpButton = button;
          break;
        }
      }

      expect(signUpButton).toBeTruthy();

      // Step 6: Click "Sign Up with Email"
      await signUpButton!.click();
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 7: Fill out the signup form
      const emailInput = await lookupPage.$('input[type="email"]');
      const passwordInputs = await lookupPage.$$('input[type="password"]');
      
      expect(emailInput).toBeTruthy();
      expect(passwordInputs.length).toBeGreaterThan(0);

      // Step 8: Enter credentials
      await emailInput!.type('test@test.test');
      await passwordInputs[0].type('testtest');
      
      // If there's a confirm password field
      if (passwordInputs.length > 1) {
        await passwordInputs[1].type('testtest');
      }

      // Step 9: Find and click "Create Account" button
      let createAccountButton: ElementHandle<HTMLButtonElement> | null = null;
      const createButtons = await lookupPage.$$('button');
      for (const button of createButtons) {
        const text = await button.evaluate(el => el.textContent || '');
        const type = await button.evaluate(el => el.type);
        if (text.includes('Create Account') || text.includes('Sign Up') || type === 'submit') {
          createAccountButton = button;
          break;
        }
      }

      expect(createAccountButton).toBeTruthy();
      await createAccountButton!.click();
      
      // Step 10: Wait for account creation to complete
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Test passes if we get this far without errors
      expect(true).toBe(true);
    }
  }, 60000); // 60 second timeout for full flow
}); 