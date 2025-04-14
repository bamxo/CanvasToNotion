
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
  fetchCourses: async () => {
    return sendMessage({ action: 'fetchCourses' });
  },
  fetchAssignments: async (courses: any[]) => {
    return sendMessage({ action: 'fetchAssignments', courses });
  },
  fetchAll: async () => {
    return sendMessage({ action: 'fetchAll' });
  }
};
