// src/background/index.ts
import { canvasApi } from '../services/canvas/api';

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  // This ensures we can use async/await with the message handler
  (async () => {
    try {
      if (message.action === 'fetchCourses') {
        const courses = await canvasApi.getRecentCourses();
        sendResponse({ success: true, data: courses });
      } 
      else if (message.action === 'fetchAssignments') {
        const assignments = await canvasApi.getAllAssignments(message.courses);
        sendResponse({ success: true, data: assignments });
      }
      else if (message.action === 'fetchAll') {
        const courses = await canvasApi.getRecentCourses();
        const assignments = await canvasApi.getAllAssignments(courses);
        sendResponse({ success: true, data: { courses, assignments } });
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