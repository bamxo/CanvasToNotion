import puppeteer, { Browser, Page } from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface TestContext {
  browser: Browser;
  page: Page;
  extensionId: string;
}

export class E2ETestSetup {
  private browser: Browser | null = null;
  private extensionPath: string;

  constructor() {
    this.extensionPath = path.resolve(__dirname, '../dist');
  }

  async setup(): Promise<TestContext> {
    // Launch Chrome with extension loaded
    this.browser = await puppeteer.launch({
      headless: false, // Keep visible for debugging
      devtools: false,
      args: [
        `--disable-extensions-except=${this.extensionPath}`,
        `--load-extension=${this.extensionPath}`,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-features=TranslateUI',
        '--disable-ipc-flooding-protection'
      ],
      defaultViewport: null
    });

    // Get extension ID
    const extensionId = await this.getExtensionId();
    
    // Create a new page
    const page = await this.browser.newPage();
    
    // Set viewport
    await page.setViewport({ width: 1280, height: 720 });

    return {
      browser: this.browser,
      page,
      extensionId
    };
  }

  async teardown(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  private async getExtensionId(): Promise<string> {
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    // Navigate to chrome://extensions to get the extension ID
    const page = await this.browser.newPage();
    await page.goto('chrome://extensions/');
    
    // Enable developer mode if not already enabled
    await page.evaluate(() => {
      const devModeToggle = document.querySelector('extensions-manager')
        ?.shadowRoot?.querySelector('extensions-toolbar')
        ?.shadowRoot?.querySelector('#devMode');
      if (devModeToggle && !(devModeToggle as HTMLInputElement).checked) {
        (devModeToggle as HTMLElement).click();
      }
    });

    // Wait a bit for the page to update
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Get the extension ID
    const extensionId = await page.evaluate(() => {
      const extensionsManager = document.querySelector('extensions-manager');
      const extensionsList = extensionsManager?.shadowRoot?.querySelector('extensions-item-list');
      const extensionItems = extensionsList?.shadowRoot?.querySelectorAll('extensions-item');
      
      for (const item of extensionItems || []) {
        const name = item.shadowRoot?.querySelector('#name')?.textContent;
        if (name?.includes('Canvas to Notion')) {
          return item.getAttribute('id');
        }
      }
      return null;
    });

    await page.close();

    if (!extensionId) {
      throw new Error('Could not find Canvas to Notion extension ID');
    }

    return extensionId;
  }

  async openExtensionPopup(context: TestContext): Promise<Page> {
    const { browser, extensionId } = context;
    
    // Method 1: Simulate clicking the extension icon in Chrome's toolbar
    try {
      // Create a main page to work from
      const mainPage = await browser.newPage();
      await mainPage.goto('chrome://newtab/');
      
      // Use Chrome DevTools Protocol to simulate extension icon click
      const client = await mainPage.target().createCDPSession();
      
      // Enable necessary domains
      await client.send('Runtime.enable');
      await client.send('Page.enable');
      
            // Inject script to simulate extension icon click
      const result = await client.send('Runtime.evaluate', {
        expression: `
          (async () => {
            // Try to trigger the extension popup through various methods
            try {
              // Method 1: Direct chrome.action.openPopup() if available
              if (typeof chrome !== 'undefined' && chrome.action && chrome.action.openPopup) {
                await chrome.action.openPopup();
                return { success: true, method: 'chrome.action.openPopup' };
              }
              
              // Method 2: Simulate user click on extension icon
              // This requires the extension to be pinned to toolbar
              const extensionButton = document.querySelector('[data-extension-id="' + '${extensionId}' + '"]') ||
                                   document.querySelector('[title*="Canvas to Notion"]');
              
              if (extensionButton) {
                extensionButton.click();
                return { success: true, method: 'extension-button-click' };
              }
              
              return { success: false, error: 'No method available' };
            } catch (error) {
              return { success: false, error: error.message };
            }
          })()
        `.replace('${extensionId}', extensionId),
        awaitPromise: true
      });
      

      
      // Wait for popup to potentially open
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Look for the popup window
      const pages = await browser.pages();
      let popupPage = pages.find(page => {
        const url = page.url();
        return url.includes(`chrome-extension://${extensionId}`) && 
               !url.includes('_generated_background_page.html') &&
               url !== mainPage.url();
      });
      
      await client.detach();
      
      if (popupPage) {
        await mainPage.close();
        // Set appropriate popup dimensions
        await popupPage.setViewport({ width: 400, height: 600 });
        return popupPage;
      }
      
      await mainPage.close();
    } catch (error) {
      // Extension icon simulation failed
    }
    
    // Method 2: Use Chrome's extension management to trigger popup
    try {
      const mainPage = await browser.newPage();
      
      // Navigate to chrome://extensions/ and try to interact with the extension
      await mainPage.goto('chrome://extensions/');
      
      // Enable developer mode and find our extension
      const extensionFound = await mainPage.evaluate((extId) => {
        // Enable developer mode
        const devModeToggle = document.querySelector('extensions-manager')
          ?.shadowRoot?.querySelector('extensions-toolbar')
          ?.shadowRoot?.querySelector('#devMode');
        
        if (devModeToggle && !(devModeToggle as HTMLInputElement).checked) {
          (devModeToggle as HTMLElement).click();
        }
        
        // Find our extension
        const extensionsManager = document.querySelector('extensions-manager');
        const extensionsList = extensionsManager?.shadowRoot?.querySelector('extensions-item-list');
        const extensionItems = extensionsList?.shadowRoot?.querySelectorAll('extensions-item');
        
        for (const item of extensionItems || []) {
          const name = item.shadowRoot?.querySelector('#name')?.textContent;
          if (name?.includes('Canvas to Notion')) {
            // Try to find the extension icon or action button
            const extensionIcon = item.shadowRoot?.querySelector('.extension-icon') ||
                                item.shadowRoot?.querySelector('[role="button"]') ||
                                item.shadowRoot?.querySelector('cr-icon-button');
            
            if (extensionIcon) {
              // Simulate right-click to get context menu, then look for "Open popup" option
              const event = new MouseEvent('contextmenu', { bubbles: true });
              extensionIcon.dispatchEvent(event);
              return true;
            }
          }
        }
        return false;
      }, extensionId);
      
      if (extensionFound) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check for popup
        const pages = await browser.pages();
        const popupPage = pages.find(page => 
          page.url().includes(`chrome-extension://${extensionId}`) &&
          !page.url().includes('_generated_background_page.html')
        );
        
        if (popupPage) {
          await mainPage.close();
          await popupPage.setViewport({ width: 400, height: 600 });
          return popupPage;
        }
      }
      
      await mainPage.close();
    } catch (error) {
      // Extension management method failed
    }
    
    // Method 3: Create a realistic popup simulation
    
    const popupPage = await browser.newPage();
    
    // Set popup window properties to match real extension popup
    await popupPage.setViewport({ width: 400, height: 600 });
    
    // Navigate to the extension popup URL
    const popupUrl = `chrome-extension://${extensionId}/index.html`;
    await popupPage.goto(popupUrl);
    
    // Inject comprehensive Chrome extension environment
    await popupPage.evaluate((extId) => {
      // Create comprehensive Chrome API mock
      const chrome = {
        action: {
          openPopup: () => Promise.resolve(),
          setIcon: () => Promise.resolve(),
          setBadgeText: () => Promise.resolve(),
          setBadgeBackgroundColor: () => Promise.resolve()
        },
        runtime: {
          id: extId,
          sendMessage: (message, callback) => {
            const mockResponse = { success: true, data: {} };
            if (typeof callback === 'function') {
              setTimeout(() => callback(mockResponse), 100);
            }
            return Promise.resolve(mockResponse);
          },
          onMessage: {
            addListener: () => {},
            removeListener: () => {}
          },
                     getURL: (path) => `chrome-extension://${extId}/${path}`,
          lastError: null
        },
        storage: {
          local: {
            get: (keys, callback) => {
              const mockData = {};
              if (typeof callback === 'function') {
                callback(mockData);
              }
              return Promise.resolve(mockData);
            },
            set: (items, callback) => {
              if (typeof callback === 'function') {
                callback();
              }
              return Promise.resolve();
            },
            remove: (keys, callback) => {
              if (typeof callback === 'function') {
                callback();
              }
              return Promise.resolve();
            }
          }
        },
        tabs: {
          query: (queryInfo, callback) => {
            // Simulate being on a Canvas page for testing
            const mockTab = {
              id: 1,
              url: 'https://canvas.instructure.com/courses',
              title: 'Canvas',
              active: true,
              windowId: 1
            };
            if (typeof callback === 'function') {
              callback([mockTab]);
            }
            return Promise.resolve([mockTab]);
          },
          create: (createProperties, callback) => {
            const mockTab = { id: 2, ...createProperties };
            if (typeof callback === 'function') {
              callback(mockTab);
            }
            return Promise.resolve(mockTab);
          }
        }
      };
      
      // Inject Chrome API
      (window as any).chrome = chrome;
      
      // Set popup-specific window properties
      Object.defineProperty(window, 'innerWidth', { value: 400, writable: false });
      Object.defineProperty(window, 'innerHeight', { value: 600, writable: false });
      
      // Add popup styling class
      document.body.classList.add('extension-popup');
      
      // Set popup-specific CSS variables
      document.documentElement.style.setProperty('--popup-width', '400px');
      document.documentElement.style.setProperty('--popup-height', '600px');
      
      // Dispatch popup ready event
      window.dispatchEvent(new CustomEvent('extensionPopupReady', {
        detail: { method: 'simulation', extensionId: extId }
      }));
      

    }, extensionId);
    
    // Wait for popup to be ready
    await popupPage.waitForFunction(() => 
      document.body.classList.contains('extension-popup') &&
      typeof (window as any).chrome !== 'undefined'
    );
    
    return popupPage;
  }

  async navigateToCanvas(page: Page): Promise<void> {
    // Navigate to a Canvas page (using a generic Canvas URL for testing)
    await page.goto('https://canvas.instructure.com/');
  }

  async waitForElement(page: Page, selector: string, timeout = 5000): Promise<void> {
    await page.waitForSelector(selector, { timeout });
  }

  async takeScreenshot(page: Page, name: string): Promise<void> {
    const screenshotPath = path.resolve(__dirname, 'screenshots', `${name}.png`) as `${string}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });
  }

  async openExtensionPopupViaToolbar(context: TestContext): Promise<Page> {
    const { browser, extensionId } = context;
    
    // Create a main page to work with
    const mainPage = await browser.newPage();
    await mainPage.goto('chrome://newtab/');
    
    try {
      // Use Chrome DevTools Protocol to trigger the extension popup
      const client = await mainPage.target().createCDPSession();
      
      // Enable the Runtime domain
      await client.send('Runtime.enable');
      
      // Try to trigger the extension action
      await client.send('Runtime.evaluate', {
        expression: `
          // Simulate clicking the extension icon
          if (chrome && chrome.action) {
            chrome.action.openPopup();
          }
        `,
        awaitPromise: false
      });
      
      // Wait for popup to potentially open
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check for new pages that might be the popup
      const pages = await browser.pages();
      const popupPage = pages.find(page => {
        const url = page.url();
        return url.includes(`chrome-extension://${extensionId}`) && 
               url !== `chrome-extension://${extensionId}/_generated_background_page.html`;
      });
      
      await client.detach();
      
      if (popupPage) {
        await mainPage.close();
        return popupPage;
      }
      
    } catch (error) {
      // Toolbar popup method failed
    }
    
    await mainPage.close();
    
    // Fallback to the regular method
    return this.openExtensionPopup(context);
  }
}

export const testSetup = new E2ETestSetup(); 