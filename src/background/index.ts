// src/background/index.ts
import { canvasApi } from '../services/canvas/api';
import { syncCanvasDataToNotion } from '../services/notion/syncToNotion';
// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  // This ensures we can use async/await with the message handler
  (async () => {
    try {
      if (message.action === 'fetchAll') {
        const courses = await canvasApi.getRecentCourses();
        const assignments = await canvasApi.getAllAssignments(courses);
        sendResponse({ success: true, data: { courses, assignments } });
        const payload = {
          courses,
          assignments,
        };
        await syncCanvasDataToNotion(payload);
       /*
        //here need to make a call to database with userid in order to get the user's associated notion access token before making call to backend
        // Send data to localhost:3000/api/notion/sync
        
        const response = await fetch('http://localhost:3000/api/notion/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${message.appJwtToken}` // Your app's JWT token
          },
          body: JSON.stringify({
            notionAccessToken: message.notionAccessToken, // Notion API token 
            pageId: message.pageId,
            courses,
            assignments
          })
        });
        
        if (!response.ok) {
          console.error('Failed to sync with Notion:', await response.text());
        } */
      }
      else {
        sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (error) {
      console.error('Error in background script:', error);
      sendResponse({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  })();
  
  // Return true to indicate we'll respond asynchronously
  return true;
});

// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Canvas to Notion extension installed');
});