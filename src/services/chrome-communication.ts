
/**
 * Send a message to the background script
 */
export function sendMessage<T = any>(message: any): Promise<T> {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          return reject(chrome.runtime.lastError);
        }
        
        if (response && response.success) {
          resolve(response.data);
        } else {
          reject(new Error(response?.error || 'Unknown error'));
        }
      });
    });
  }
  
  /**
   * Canvas data api for the frontend
   */
  export const canvasDataApi = {
    fetchAll: async () => {
      return sendMessage({ action: 'fetchAll' });
    },
    
    syncCanvasData: async (userId: string) => {
      // Send the sync message to the background
      return sendMessage({ type: 'SYNC_CANVAS_DATA', userId });
    }
  };
  