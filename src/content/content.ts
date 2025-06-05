// Content script for sending extension ID to web app
console.log('Content script loaded in web app page');

// Function to send extension ID
function sendExtensionId() {
  try {
    const extensionId = chrome.runtime.id;
    console.log('Attempting to send extension ID:', extensionId);
    
    // Create and dispatch a custom event
    const event = new CustomEvent('EXTENSION_ID_MESSAGE', {
      detail: {
        type: 'EXTENSION_ID',
        extensionId: extensionId
      }
    });
    window.dispatchEvent(event);
    
    // Also try postMessage
    window.postMessage({ 
      type: 'EXTENSION_ID',
      extensionId: extensionId 
    }, '*');
    
    console.log('Extension ID sent via both methods');
  } catch (error) {
    console.error('Error sending extension ID:', error);
  }
}

// Send immediately when script loads
console.log('Sending initial extension ID...');
sendExtensionId();

// Also send when the page is fully loaded
window.addEventListener('load', () => {
  console.log('Page loaded, sending extension ID again...');
  sendExtensionId();
});

// Listen for messages from the web app
window.addEventListener('message', (event) => {
  console.log('Received message in content script:', event.data);
  
  // If web app requests extension ID, send it again
  if (event.data.type === 'REQUEST_EXTENSION_ID') {
    console.log('Web app requested extension ID, sending...');
    sendExtensionId();
  }
}); 