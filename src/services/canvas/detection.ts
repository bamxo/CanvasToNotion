export interface CanvasInfo {
  isCanvas: boolean;
  domain?: string;
  baseUrl?: string;
  apiUrl?: string;
  pattern?: string;
}

/**
 * Detects if a URL matches Canvas LMS patterns
 */
export const detectCanvasPage = (url: string): boolean => {
  const canvasPatterns = [
    /^https?:\/\/[^\/]*\.instructure\.com/i,  // *.instructure.com
    /^https?:\/\/canvas\.[^\/]+/i,            // canvas.*
    /^https?:\/\/lms\.[^\/]+/i,               // lms.*
    /^https?:\/\/learn\.[^\/]+/i,             // learn.*
    /^https?:\/\/[^\/]*\/courses\/\d+/i,      // Any domain with /courses/
    /^https?:\/\/[^\/]*\/login\/canvas/i,     // Any domain with /login/canvas
  ];

  return canvasPatterns.some(pattern => pattern.test(url));
};

/**
 * Extracts Canvas information from a URL
 */
export const extractCanvasInfo = (url: string): CanvasInfo | null => {
  if (!detectCanvasPage(url)) {
    return { isCanvas: false };
  }

  try {
    const urlObj = new URL(url);
    
    // Determine which pattern matched
    let matchedPattern = 'unknown';
    if (/\.instructure\.com/i.test(url)) {
      matchedPattern = '*.instructure.com';
    } else if (/^https?:\/\/canvas\./i.test(url)) {
      matchedPattern = 'canvas.*';
    } else if (/^https?:\/\/lms\./i.test(url)) {
      matchedPattern = 'lms.*';
    } else if (/^https?:\/\/learn\./i.test(url)) {
      matchedPattern = 'learn.*';
    } else if (/\/courses\/\d+/i.test(url)) {
      matchedPattern = 'custom domain with /courses/';
    }

    return {
      isCanvas: true,
      domain: urlObj.host,
      baseUrl: `${urlObj.protocol}//${urlObj.host}`,
      apiUrl: `${urlObj.protocol}//${urlObj.host}/api/v1`,
      pattern: matchedPattern
    };
  } catch (error) {
    console.error('Error parsing Canvas URL:', error);
    return { isCanvas: false };
  }
};

/**
 * Gets Canvas info from current active tab
 */
export const getCurrentCanvasInfo = (): Promise<CanvasInfo> => {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const currentUrl = tabs[0]?.url || '';
      const canvasInfo = extractCanvasInfo(currentUrl);
      resolve(canvasInfo || { isCanvas: false });
    });
  });
}; 