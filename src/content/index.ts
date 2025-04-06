// Content script that runs on Canvas pages
console.log('Canvas to Notion: Content script loaded');

// Function to detect if we're on an assignments page
function isAssignmentsPage() {
  return window.location.pathname.includes('/assignments');
}

// Function to extract assignment information
function extractAssignmentInfo() {
  const assignments = [];
  const assignmentElements = document.querySelectorAll('.assignment');
  
  assignmentElements.forEach(assignment => {
    const title = assignment.querySelector('.title')?.textContent?.trim();
    const dueDate = assignment.querySelector('.due_date')?.textContent?.trim();
    const points = assignment.querySelector('.points_possible')?.textContent?.trim();
    
    if (title) {
      assignments.push({
        title,
        dueDate,
        points,
        url: window.location.href
      });
    }
  });

  return assignments;
}

// Listen for messages from the extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getAssignments') {
    const assignments = extractAssignmentInfo();
    sendResponse({ assignments });
  }
  return true; // Required for async response
});

// Initial page load detection
if (isAssignmentsPage()) {
  chrome.runtime.sendMessage({
    action: 'pageLoaded',
    type: 'assignments',
    url: window.location.href
  });
} 