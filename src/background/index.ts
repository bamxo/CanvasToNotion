// src/background/index.ts
console.log('Background script initializing...');

import { canvasApi } from '../services/canvas/api';
import './auth';  // Import auth module to initialize token handling

console.log('Background script initialized, auth module imported');

// Keep service worker alive
chrome.runtime.onStartup.addListener(() => {
  console.log("Extension started up, service worker activated");
});

// Periodic ping to keep service worker alive
setInterval(() => {
  console.log("Service worker heartbeat");
}, 25000); // Every 25 seconds

// Function to sync data with Notion through our backend
async function syncWithNotion(courses: any[], assignments: any[], message: any) {
  try {
    console.log('Starting sync with Notion for', courses.length, 'courses and', assignments.length, 'assignments');
    
    // Extract only the necessary data to reduce payload size
    const simplifiedCourses = courses.map(course => ({
      id: course.id,
      name: course.name
    }));
    
    const simplifiedAssignments = assignments.map(assignment => ({
      id: assignment.id,
      name: assignment.name,
      courseId: assignment.course_id,
      due_at: assignment.due_at,
      points_possible: assignment.points_possible,
      html_url: assignment.html_url
    }));
    
    // First, check if the server is reachable
    try {
      await fetch('http://localhost:3000', { method: 'HEAD' });
    } catch (e) {
      console.warn('Server might not be running at localhost:3000');
    }
    
    const payload = {
      email: message.type === 'SYNC_TO_NOTION' ? message.data.email : null,
      pageId: message.type === 'SYNC_TO_NOTION' ? message.data.pageId : null,
      courses: simplifiedCourses,
      assignments: simplifiedAssignments
    };
    
    // Validate payload before sending
    if (!payload.email || !payload.pageId) {
      console.warn('Missing email or pageId, but continuing with sync attempt');
    }
    
    console.log('Sending sync payload:', payload);
    
    const response = await fetch('http://localhost:3000/api/notion/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    // Check if response is actually JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      // If not JSON, get the text and log it for debugging
      const textResponse = await response.text();
      console.error('Server returned non-JSON response:', textResponse);
      throw new Error('Server returned non-JSON response');
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Sync failed');
    }
    
    console.log('Successfully synced with Notion:', data);
    return data;
  } catch (error) {
    console.error('Error syncing with Notion:', error);
    throw error;
  }
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  // This ensures we can use async/await with the message handler
  (async () => {
    try {
      if (message.type === 'SYNC_TO_NOTION') {
        console.log('Received SYNC_TO_NOTION message:', message);
        // First fetch all necessary data
        const courses = await canvasApi.getRecentCourses();
        console.log('Fetched courses:', courses);
        
        const assignments = await canvasApi.getAllAssignments(courses);
        console.log('Fetched assignments:', assignments);
        
        // Then sync with Notion
        try {
          const syncResult = await syncWithNotion(courses, assignments, message);
          
          // Return all data including sync results
          sendResponse({ 
            success: true, 
            data: { 
              courses, 
              assignments,
              syncResult
            } 
          });
        } catch (error: any) {
          console.error('Sync encountered an issue:', error);
          // Only treat it as an error if the sync actually failed
          const syncError = error instanceof Error ? error : new Error(String(error));
          const isActualError = syncError.message.includes('failed') || 
                              syncError.message.includes('error');
          
          sendResponse({ 
            success: !isActualError,
            data: { courses, assignments },
            syncWarning: isActualError ? undefined : syncError.message,
            syncError: isActualError ? syncError.message : undefined
          });
        }
      } else if (message.action === 'fetchAll') {
        console.log('Fetching all Canvas data...');
        // First fetch all necessary data
        const courses = await canvasApi.getRecentCourses();
        console.log('Fetched courses:', courses);
        
        const assignments = await canvasApi.getAllAssignments(courses);
        console.log('Fetched assignments:', assignments);
        
        // Then sync with Notion
        try {
          const syncResult = await syncWithNotion(courses, assignments, message);
          
          // Return all data including sync results
          sendResponse({ 
            success: true, 
            data: { 
              courses, 
              assignments,
              syncResult
            } 
          });
        } catch (error: any) {
          console.error('Sync encountered an issue:', error);
          // Only treat it as an error if the sync actually failed
          const syncError = error instanceof Error ? error : new Error(String(error));
          const isActualError = syncError.message.includes('failed') || 
                              syncError.message.includes('error');
          
          sendResponse({ 
            success: !isActualError,
            data: { courses, assignments },
            syncWarning: isActualError ? undefined : syncError.message,
            syncError: isActualError ? syncError.message : undefined
          });
        }
      } else {
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