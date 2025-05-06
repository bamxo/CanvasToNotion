// src/background/index.ts
import { canvasApi } from '../services/canvas/api';

// Function to sync data with Notion through our backend
async function syncWithNotion(courses: any[], assignments: any[]) {
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
      email: "benliu297@gmail.com",
      pageId: "1d54b569-44da-804e-88d6-e0ac3b5bff75",
      courses: simplifiedCourses,
      assignments: simplifiedAssignments
    };
    
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
      if (message.action === 'fetchAll') {
        console.log('Fetching all Canvas data...');
        // First fetch all necessary data
        const courses = await canvasApi.getRecentCourses();
        console.log('Fetched courses:', courses);
        
        const assignments = await canvasApi.getAllAssignments(courses);
        console.log('Fetched assignments:', assignments);
        
        // Then sync with Notion
        try {
          const syncResult = await syncWithNotion(courses, assignments);
          
          // Return all data including sync results
          sendResponse({ 
            success: true, 
            data: { 
              courses, 
              assignments,
              syncResult
            } 
          });
        } catch (syncError) {
          // If sync fails, we still return the fetched data
          console.error('Sync error:', syncError);
          sendResponse({ 
            success: true,  // Still consider this a successful data fetch
            data: { courses, assignments },
            syncError: syncError instanceof Error ? syncError.message : 'Sync failed'
          });
        }
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