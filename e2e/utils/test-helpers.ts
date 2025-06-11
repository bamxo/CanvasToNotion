import { Page } from 'puppeteer';

/**
 * Wait for an element to be visible and enabled
 */
export async function waitForElementReady(page: Page, selector: string, timeout = 5000): Promise<void> {
  await page.waitForSelector(selector, { visible: true, timeout });
  await page.waitForFunction(
    (sel) => {
      const element = document.querySelector(sel) as HTMLElement;
      return element && !element.hasAttribute('disabled');
    },
    { timeout },
    selector
  );
}

/**
 * Click an element and wait for navigation or response
 */
export async function clickAndWait(page: Page, selector: string, waitTime = 1000): Promise<void> {
  await page.click(selector);
  await new Promise(resolve => setTimeout(resolve, waitTime));
}

/**
 * Type text into an input field
 */
export async function typeIntoField(page: Page, selector: string, text: string): Promise<void> {
  await page.focus(selector);
  await page.keyboard.type(text);
}

/**
 * Get text content from an element
 */
export async function getElementText(page: Page, selector: string): Promise<string> {
  return await page.$eval(selector, el => el.textContent || '');
}

/**
 * Check if an element exists on the page
 */
export async function elementExists(page: Page, selector: string): Promise<boolean> {
  const element = await page.$(selector);
  return element !== null;
}

/**
 * Wait for text to appear in an element
 */
export async function waitForText(page: Page, selector: string, expectedText: string, timeout = 5000): Promise<void> {
  await page.waitForFunction(
    (sel, text) => {
      const element = document.querySelector(sel);
      return element && element.textContent?.includes(text);
    },
    { timeout },
    selector,
    expectedText
  );
}

/**
 * Mock Chrome storage for testing
 */
export async function mockChromeStorage(page: Page, data: Record<string, any>): Promise<void> {
  await page.evaluate((storageData) => {
    // Mock chrome.storage.local
    (window as any).chrome = (window as any).chrome || {};
    (window as any).chrome.storage = (window as any).chrome.storage || {};
    (window as any).chrome.storage.local = {
      get: (keys: string[] | string | null, callback: (result: any) => void) => {
        if (typeof keys === 'string') {
          callback({ [keys]: storageData[keys] });
        } else if (Array.isArray(keys)) {
          const result: any = {};
          keys.forEach(key => {
            result[key] = storageData[key];
          });
          callback(result);
        } else {
          callback(storageData);
        }
      },
      set: (items: Record<string, any>, callback?: () => void) => {
        Object.assign(storageData, items);
        if (callback) callback();
      }
    };
  }, data);
}

/**
 * Mock Chrome runtime for testing
 */
export async function mockChromeRuntime(page: Page): Promise<void> {
  await page.evaluate(() => {
    (window as any).chrome = (window as any).chrome || {};
    (window as any).chrome.runtime = (window as any).chrome.runtime || {};
    (window as any).chrome.runtime.sendMessage = (message: any, callback?: (response: any) => void) => {
      // Mock response based on message type
      const mockResponse = { success: true, data: {} };
      if (callback) {
        setTimeout(() => callback(mockResponse), 100);
      }
      return Promise.resolve(mockResponse);
    };
  });
}

/**
 * Mock Chrome tabs API for testing
 */
export async function mockChromeTabs(page: Page, currentUrl = 'https://canvas.instructure.com/'): Promise<void> {
  await page.evaluate((url) => {
    (window as any).chrome = (window as any).chrome || {};
    (window as any).chrome.tabs = (window as any).chrome.tabs || {};
    (window as any).chrome.tabs.query = (queryInfo: any, callback: (tabs: any[]) => void) => {
      const mockTab = {
        id: 1,
        url: url,
        title: 'Canvas',
        active: true,
        windowId: 1
      };
      callback([mockTab]);
    };
    (window as any).chrome.tabs.create = (createProperties: any) => {
      // Mock tab creation
      
    };
  }, currentUrl);
}

/**
 * Setup common Chrome API mocks
 */
export async function setupChromeMocks(page: Page, options: {
  storageData?: Record<string, any>;
  currentUrl?: string;
} = {}): Promise<void> {
  await mockChromeStorage(page, options.storageData || {});
  await mockChromeRuntime(page);
  await mockChromeTabs(page, options.currentUrl);
}

/**
 * Wait for page to be fully loaded
 */
export async function waitForPageLoad(page: Page, timeout = 10000): Promise<void> {
  await page.waitForSelector('body', { timeout });
  await new Promise(resolve => setTimeout(resolve, 1000)); // Additional wait for dynamic content
}

/**
 * Scroll element into view
 */
export async function scrollIntoView(page: Page, selector: string): Promise<void> {
  await page.$eval(selector, el => el.scrollIntoView({ behavior: 'smooth', block: 'center' }));
}

/**
 * Get all button texts on the page
 */
export async function getAllButtonTexts(page: Page): Promise<string[]> {
  return await page.$$eval('button', buttons => 
    buttons.map(btn => btn.textContent?.trim() || '')
  );
}

/**
 * Find button by text content
 */
export async function findButtonByText(page: Page, text: string): Promise<boolean> {
  const buttons = await getAllButtonTexts(page);
  return buttons.some(btnText => btnText.toLowerCase().includes(text.toLowerCase()));
}

export interface TestCredentials {
  email: string;
  password: string;
}

export interface MockAssignment {
  id: string;
  title: string;
  course: string;
  dueDate: string;
  type: string;
  description?: string;
  points?: number;
}

export interface MockNotionPage {
  id: string;
  title: string;
  icon: string;
}

export class TestHelpers {
  static readonly TEST_CREDENTIALS: TestCredentials = {
    email: 'test@test.test',
    password: 'testtest'
  };

  /**
   * Set authenticated state in popup
   */
  static async setAuthenticatedState(page: Page, credentials: TestCredentials = TestHelpers.TEST_CREDENTIALS): Promise<void> {
    await page.evaluate((creds) => {
      (window as any).chrome.storage.local.set({
        userEmail: creds.email,
        firebaseToken: 'mock-auth-token',
        isAuthenticated: true
      });
    }, credentials);
  }

  /**
   * Clear authentication state
   */
  static async clearAuthState(page: Page): Promise<void> {
    await page.evaluate(() => {
      (window as any).chrome.storage.local.clear();
    });
  }

  /**
   * Generate mock assignments for testing
   */
  static generateMockAssignments(count: number = 5): MockAssignment[] {
    const courses = ['Math 101', 'History 201', 'Physics 301', 'English 102', 'Chemistry 205'];
    const assignmentTypes = ['homework', 'quiz', 'exam', 'project', 'discussion'];
    
    return Array.from({ length: count }, (_, i) => ({
      id: `assignment-${i + 1}`,
      title: `${courses[i % courses.length]} - Assignment ${i + 1}`,
      course: courses[i % courses.length],
      dueDate: new Date(Date.now() + (i + 1) * 86400000).toISOString(),
      type: assignmentTypes[i % assignmentTypes.length],
      description: `This is a test assignment for ${courses[i % courses.length]}`,
      points: Math.floor(Math.random() * 100) + 50
    }));
  }

  /**
   * Generate mock Notion pages
   */
  static generateMockNotionPages(count: number = 3): MockNotionPage[] {
    const pageTemplates = [
      { title: 'Assignments Database', icon: '📋' },
      { title: 'Course Notes', icon: '📝' },
      { title: 'Study Schedule', icon: '📅' },
      { title: 'Project Tracker', icon: '🎯' },
      { title: 'Reading List', icon: '📚' }
    ];

    return Array.from({ length: count }, (_, i) => ({
      id: `notion-page-${i + 1}`,
      ...pageTemplates[i % pageTemplates.length]
    }));
  }

  /**
   * Mock Canvas page detection
   */
  static async mockCanvasPageDetection(page: Page, courseId: string = '123', courseName: string = 'Test Course'): Promise<void> {
    await page.evaluate((id, name) => {
      (window as any).chrome.tabs.query = (queryInfo, callback) => {
        callback([{
          id: 1,
          url: `https://canvas.instructure.com/courses/${id}`,
          title: `${name} - Canvas`,
          active: true
        }]);
      };

      (window as any).chrome.storage.local.set({
        isOnCanvasPage: true,
        currentCanvasUrl: `https://canvas.instructure.com/courses/${id}`,
        detectedCourse: {
          id: id,
          name: name
        }
      });
    }, courseId, courseName);
  }

  /**
   * Mock non-Canvas page
   */
  static async mockNonCanvasPage(page: Page): Promise<void> {
    await page.evaluate(() => {
      (window as any).chrome.tabs.query = (queryInfo, callback) => {
        callback([{
          id: 1,
          url: 'https://google.com',
          title: 'Google',
          active: true
        }]);
      };

      (window as any).chrome.storage.local.set({
        isOnCanvasPage: false,
        currentCanvasUrl: null,
        detectedCourse: null
      });
    });
  }

  /**
   * Mock successful sync response
   */
  static async mockSuccessfulSync(page: Page, syncedCount: number = 5): Promise<void> {
    await page.evaluate((count) => {
      (window as any).chrome.runtime.sendMessage = (message, callback) => {
        if (message.type === 'SYNC' || message.type === 'COMPARE') {
          const mockResponse = {
            success: true,
            data: {
              syncedCount: count,
              newAssignments: Math.floor(count * 0.6),
              updatedAssignments: Math.floor(count * 0.4),
              timestamp: new Date().toISOString()
            }
          };
          if (typeof callback === 'function') {
            setTimeout(() => callback(mockResponse), 1000);
          }
          return Promise.resolve(mockResponse);
        }
        return Promise.resolve({ success: true });
      };
    }, syncedCount);
  }

  /**
   * Mock sync error
   */
  static async mockSyncError(page: Page, errorMessage: string = 'Sync failed'): Promise<void> {
    await page.evaluate((error) => {
      (window as any).chrome.runtime.sendMessage = (message, callback) => {
        if (message.type === 'SYNC' || message.type === 'COMPARE') {
          const errorResponse = {
            success: false,
            error: error,
            code: 'SYNC_ERROR'
          };
          if (typeof callback === 'function') {
            setTimeout(() => callback(errorResponse), 500);
          }
          return Promise.reject(new Error(error));
        }
        return Promise.resolve({ success: true });
      };
    }, errorMessage);
  }

  /**
   * Set Notion page selection state
   */
  static async setNotionPageSelected(page: Page, notionPage: MockNotionPage): Promise<void> {
    await page.evaluate((pageData) => {
      (window as any).chrome.storage.local.set({
        selectedNotionPage: pageData,
        showPageSelector: false
      });
    }, notionPage);
  }

  /**
   * Set page selector state with available pages
   */
  static async setPageSelectorState(page: Page, availablePages: MockNotionPage[]): Promise<void> {
    await page.evaluate((pages) => {
      (window as any).chrome.storage.local.set({
        showPageSelector: true,
        availablePages: pages,
        selectedNotionPage: null
      });
    }, availablePages);
  }

  /**
   * Set unsynced items
   */
  static async setUnsyncedItems(page: Page, assignments: MockAssignment[]): Promise<void> {
    await page.evaluate((items) => {
      (window as any).chrome.storage.local.set({
        unsyncedItems: items
      });
    }, assignments);
  }

  /**
   * Wait for element with retry
   */
  static async waitForElementWithRetry(page: Page, selector: string, maxRetries: number = 3): Promise<boolean> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 });
        return true;
      } catch (error) {
        if (i === maxRetries - 1) {
          return false;
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    return false;
  }

  /**
   * Click button by text content
   */
  static async clickButtonByText(page: Page, text: string, caseSensitive: boolean = false): Promise<boolean> {
    const buttons = await page.$$('button');
    
    for (const button of buttons) {
      const buttonText = await button.evaluate(el => el.textContent || '');
      const textToMatch = caseSensitive ? buttonText : buttonText.toLowerCase();
      const searchText = caseSensitive ? text : text.toLowerCase();
      
      if (textToMatch.includes(searchText)) {
        await button.click();
        return true;
      }
    }
    return false;
  }

  /**
   * Fill form fields
   */
  static async fillForm(page: Page, fields: Record<string, string>): Promise<void> {
    for (const [selector, value] of Object.entries(fields)) {
      const element = await page.$(selector);
      if (element) {
        await element.click({ clickCount: 3 }); // Select all existing text
        await element.type(value);
      }
    }
  }

  /**
   * Get page text content
   */
  static async getPageText(page: Page): Promise<string> {
    return await page.evaluate(() => document.body.textContent || '');
  }

  /**
   * Check if text exists on page
   */
  static async hasText(page: Page, text: string, caseSensitive: boolean = false): Promise<boolean> {
    const pageText = await TestHelpers.getPageText(page);
    const textToSearch = caseSensitive ? pageText : pageText.toLowerCase();
    const searchText = caseSensitive ? text : text.toLowerCase();
    return textToSearch.includes(searchText);
  }

  /**
   * Mock Chrome extension APIs
   */
  static async mockChromeAPIs(page: Page): Promise<void> {
    await page.evaluate(() => {
      // Mock chrome.runtime
      (window as any).chrome = {
        runtime: {
          sendMessage: (message, callback) => {
            const mockResponse = { success: true, data: 'mock-response' };
            if (typeof callback === 'function') {
              setTimeout(() => callback(mockResponse), 100);
            }
            return Promise.resolve(mockResponse);
          },
          onMessage: {
            addListener: () => {},
            removeListener: () => {}
          },
          id: 'mock-extension-id'
        },
        storage: {
          local: {
            get: (keys, callback) => {
              const mockData = {};
              if (typeof callback === 'function') {
                callback(mockData);
              }
            },
            set: (data, callback) => {
              if (typeof callback === 'function') {
                callback();
              }
            },
            clear: (callback) => {
              if (typeof callback === 'function') {
                callback();
              }
            }
          }
        },
        tabs: {
          query: (queryInfo, callback) => {
            const mockTab = {
              id: 1,
              url: 'https://example.com',
              title: 'Example Page',
              active: true
            };
            if (typeof callback === 'function') {
              callback([mockTab]);
            }
          },
          create: (createProperties, callback) => {
            const mockTab = {
              id: 2,
              url: createProperties.url,
              title: 'New Tab'
            };
            if (typeof callback === 'function') {
              callback(mockTab);
            }
          }
        },
        action: {
          openPopup: () => Promise.resolve()
        }
      };
    });
  }

  /**
   * Simulate network delay
   */
  static async simulateNetworkDelay(page: Page, delayMs: number = 1000): Promise<void> {
    await page.evaluate((delay) => {
      const originalSendMessage = (window as any).chrome?.runtime?.sendMessage;
      if (originalSendMessage) {
        (window as any).chrome.runtime.sendMessage = (message, callback) => {
          setTimeout(() => {
            originalSendMessage(message, callback);
          }, delay);
        };
      }
    }, delayMs);
  }

  /**
   * Generate test data for performance testing
   */
  static generateLargeDataset(itemCount: number = 1000): any[] {
    return Array.from({ length: itemCount }, (_, i) => ({
      id: `item-${i}`,
      title: `Test Item ${i}`,
      description: `This is test item number ${i} with some additional data`.repeat(5),
      timestamp: new Date(Date.now() - i * 1000).toISOString(),
      metadata: {
        category: `Category ${i % 10}`,
        priority: i % 5,
        tags: [`tag-${i % 3}`, `tag-${i % 7}`]
      }
    }));
  }

  /**
   * Measure operation time
   */
  static async measureTime<T>(operation: () => Promise<T>): Promise<{ result: T; duration: number }> {
    const startTime = Date.now();
    const result = await operation();
    const duration = Date.now() - startTime;
    return { result, duration };
  }

  /**
   * Wait for condition with timeout
   */
  static async waitForCondition(
    condition: () => Promise<boolean>,
    timeoutMs: number = 5000,
    intervalMs: number = 100
  ): Promise<boolean> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      if (await condition()) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
    
    return false;
  }

  /**
   * Retry operation with exponential backoff
   */
  static async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelayMs: number = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < maxRetries - 1) {
          const delay = baseDelayMs * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError!;
  }

  /**
   * Create mock sync history
   */
  static generateMockSyncHistory(count: number = 10): any[] {
    const statuses = ['success', 'error', 'partial'];
    
    return Array.from({ length: count }, (_, i) => ({
      id: `sync-${i}`,
      timestamp: new Date(Date.now() - i * 3600000).toISOString(),
      status: statuses[i % statuses.length],
      itemsCount: Math.floor(Math.random() * 20) + 1,
      duration: Math.floor(Math.random() * 5000) + 500,
      details: {
        newItems: Math.floor(Math.random() * 10),
        updatedItems: Math.floor(Math.random() * 5),
        errors: i % 3 === 2 ? ['Sample error message'] : []
      }
    }));
  }
} 