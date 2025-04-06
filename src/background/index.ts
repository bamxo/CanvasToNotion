// Background service worker
console.log('Canvas to Notion: Background service worker initialized');

// Store for authentication state
let isAuthenticated = false;

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'pageLoaded':
      handlePageLoaded(request, sender);
      break;
    
    case 'authenticate':
      handleAuthentication(request, sendResponse);
      break;
    
    case 'syncToNotion':
      handleNotionSync(request, sendResponse);
      break;
  }
  return true; // Required for async response
});

// Handle new page loads
async function handlePageLoaded(request, sender) {
  if (request.type === 'assignments') {
    // Get assignments from the page
    const response = await chrome.tabs.sendMessage(sender.tab.id, {
      action: 'getAssignments'
    });
    
    if (response?.assignments) {
      // Store assignments in extension storage
      chrome.storage.local.set({
        lastAssignments: response.assignments,
        lastSync: new Date().toISOString()
      });
    }
  }
}

// Handle authentication with Notion
async function handleAuthentication(request, sendResponse) {
  try {
    // Here you would implement Notion OAuth flow
    // For now, we'll just store the token if provided
    if (request.notionToken) {
      await chrome.storage.local.set({ notionToken: request.notionToken });
      isAuthenticated = true;
      sendResponse({ success: true });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Handle syncing to Notion
async function handleNotionSync(request, sendResponse) {
  try {
    const { notionToken } = await chrome.storage.local.get('notionToken');
    if (!notionToken) {
      throw new Error('Not authenticated with Notion');
    }

    const { lastAssignments } = await chrome.storage.local.get('lastAssignments');
    if (!lastAssignments) {
      throw new Error('No assignments to sync');
    }

    // Here you would implement the actual Notion API calls
    // For now, we'll just simulate success
    await chrome.storage.local.set({ lastSyncTime: new Date().toISOString() });
    
    sendResponse({ 
      success: true, 
      message: `Synced ${lastAssignments.length} assignments to Notion` 
    });
  } catch (error) {
    console.error('Sync error:', error);
    sendResponse({ success: false, error: error.message });
  }
} 