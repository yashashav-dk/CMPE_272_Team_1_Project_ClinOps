import { req } from './_req';

export interface ChatMessage {
  text: string;
  sender: 'user' | 'ai';
  persona?: string;
  timestamp?: string;
}

export interface ProjectQuestion {
  id: string;
  question: string;
  answered: boolean;
  answer?: string;
}

export interface ChatData {
  id?: string;
  projectId: string;
  userId: string;
  messages: ChatMessage[];
  projectInfo?: Record<string, any>;
  persona?: string;
  currentTab?: string;
  tabContent?: Record<string, string>;
  tabContentGeneration?: Record<string, string>;
  createdAt?: string;
  updatedAt?: string;
}

export interface ChatApiResponse {
  success: boolean;
  data?: ChatData;
  error?: string;
  message?: string;
}

/**
 * Save chat data to the backend
 * @param projectId Project ID
 * @param messages Array of chat messages
 * @param projectInfo Answered project questions
 * @param persona Current AI persona
 * @param currentTab Active tab
 * @param tabContent Generated content for each tab
 * @param tabContentGeneration Generation status for each tab
 * @returns Promise with the save result
 */
export async function saveChatData(
  projectId: string,
  userId: string,
  messages: ChatMessage[],
  projectInfo?: Record<string, any>,
  persona?: string,
  currentTab?: string,
  tabContent?: Record<string, string>,
  tabContentGeneration?: Record<string, string>
): Promise<ChatApiResponse> {
  try {
    // Ensure we always have a userId even if one wasn't provided
    const actualUserId = userId || 'default-user';
    
    // Validate required parameters
    if (!projectId) {
      throw new Error('Project ID is required but was not provided');
    }
    
    // Log what we're about to send for debugging
    console.log('saveChatData called with projectId:', projectId, 'and userId:', actualUserId);
    
    const payload = {
      projectId,
      userId: actualUserId,
      messages,
      projectInfo,
      persona,
      currentTab,
      tabContent,
      tabContentGeneration
    };
    
    console.log('Full payload being sent:', payload);
    const response = await req.post('/api/ai/chat/save', payload);

    // Handle nested response structure
    if (response.data?.data) {
      return response.data.data;
    } else {
      return response.data;
    }
  } catch (error: any) {
    // Ensure we have a string representation of the error
    const errorMessage = error?.message || (error instanceof Error ? error.toString() : 'Unknown error');
    
    // Define interface for safe error details with optional properties
    interface SafeErrorDetails {
      message: string;
      type: string;
      code?: string | number;
      name?: string;
      stack?: string;
      statusCode?: number;
      responseData?: string;
      responseDataError?: string;
    }
    
    // Create a safe serializable error object without circular references
    const safeErrorDetails: SafeErrorDetails = {
      message: errorMessage,
      type: error?.constructor?.name || typeof error,
      code: error?.code,
      name: error?.name,
      stack: error?.stack?.split('\n').slice(0, 3).join('\n') // Only include first few lines of stack
    };
    
    // Safely extract response data if available
    if (error?.response) {
      try {
        safeErrorDetails.statusCode = error.response.status;
        if (error.response.data) {
          if (typeof error.response.data === 'string') {
            safeErrorDetails.responseData = error.response.data.substring(0, 500); // Limit string length
          } else {
            safeErrorDetails.responseData = JSON.stringify(error.response.data);
          }
        }
      } catch (jsonError) {
        safeErrorDetails.responseDataError = 'Could not serialize response data';
      }
    }
    
    console.error('Error saving chat data:', safeErrorDetails);
    
    return {
      success: false,
      error: error?.response?.data?.error || errorMessage || 'Failed to save chat data'
    };
  }
}

/**
 * Load chat data from the backend
 * @param projectId Project ID
 * @returns Promise with the chat data
 */
export async function loadChatData(projectId: string): Promise<ChatApiResponse> {
  try {
    const response = await req.get(`/api/ai/chat/${projectId}`);

    // Handle nested response structure
    if (response.data?.data) {
      return response.data.data;
    } else {
      return response.data;
    }
  } catch (error: any) {
    // Ensure we have a string representation of the error
    const errorMessage = error?.message || (error instanceof Error ? error.toString() : 'Unknown error');
    
    // Define interface for safe error details with optional properties
    interface SafeErrorDetails {
      message: string;
      type: string;
      code?: string | number;
      name?: string;
      stack?: string;
      statusCode?: number;
      responseData?: string;
      responseDataError?: string;
    }
    
    // Create a safe serializable error object without circular references
    const safeErrorDetails: SafeErrorDetails = {
      message: errorMessage,
      type: error?.constructor?.name || typeof error,
      code: error?.code,
      name: error?.name,
      stack: error?.stack?.split('\n').slice(0, 3).join('\n') // Only include first few lines of stack
    };
    
    // Safely extract response data if available
    if (error?.response) {
      try {
        safeErrorDetails.statusCode = error.response.status;
        if (error.response.data) {
          if (typeof error.response.data === 'string') {
            safeErrorDetails.responseData = error.response.data.substring(0, 500); // Limit string length
          } else {
            safeErrorDetails.responseData = JSON.stringify(error.response.data);
          }
        }
      } catch (jsonError) {
        safeErrorDetails.responseDataError = 'Could not serialize response data';
      }
    }
    
    console.error('Error loading chat data:', safeErrorDetails);
    
    return {
      success: false,
      error: error?.response?.data?.error || errorMessage || 'Failed to load chat data'
    };
  }
}

/**
 * Clear chat data for a project
 * @param projectId Project ID
 * @returns Promise with the clear result
 */
export async function clearChatData(projectId: string): Promise<ChatApiResponse> {
  try {
    const response = await req.put(`/api/ai/chat/clear/${projectId}`);

    // Handle nested response structure
    if (response.data?.data) {
      return response.data.data;
    } else {
      return response.data;
    }
  } catch (error: any) {
    // Ensure we have a string representation of the error
    const errorMessage = error?.message || (error instanceof Error ? error.toString() : 'Unknown error');
    
    // Define interface for safe error details with optional properties
    interface SafeErrorDetails {
      message: string;
      type: string;
      code?: string | number;
      name?: string;
      stack?: string;
      statusCode?: number;
      responseData?: string;
      responseDataError?: string;
    }
    
    // Create a safe serializable error object without circular references
    const safeErrorDetails: SafeErrorDetails = {
      message: errorMessage,
      type: error?.constructor?.name || typeof error,
      code: error?.code,
      name: error?.name,
      stack: error?.stack?.split('\n').slice(0, 3).join('\n') // Only include first few lines of stack
    };
    
    // Safely extract response data if available
    if (error?.response) {
      try {
        safeErrorDetails.statusCode = error.response.status;
        if (error.response.data) {
          if (typeof error.response.data === 'string') {
            safeErrorDetails.responseData = error.response.data.substring(0, 500); // Limit string length
          } else {
            safeErrorDetails.responseData = JSON.stringify(error.response.data);
          }
        }
      } catch (jsonError) {
        safeErrorDetails.responseDataError = 'Could not serialize response data';
      }
    }
    
    console.error('Error clearing chat data:', safeErrorDetails);
    
    return {
      success: false,
      error: error?.response?.data?.error || errorMessage || 'Failed to clear chat data'
    };
  }
}

/**
 * Auto-save chat data with debouncing to prevent too many API calls
 * Note: This functionality is temporarily disabled as requested
 */
let saveTimeout: NodeJS.Timeout | null = null;

export function autoSaveChatData(
  projectId: string,
  userId: string,
  messages: ChatMessage[],
  projectInfo?: Record<string, any>,
  persona?: string,
  currentTab?: string,
  tabContent?: Record<string, string>,
  tabContentGeneration?: Record<string, string>,
  delay: number = 2000
): void {
  // Clear previous timeout
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }

  // Set new timeout
  saveTimeout = setTimeout(async () => {
    try {
      await saveChatData(projectId, userId || 'default-user', messages, projectInfo, persona, currentTab, tabContent, tabContentGeneration);
      console.log(`Auto-saved chat data for project: ${projectId}, messages: ${messages?.length || 0}`);
    } catch (error: any) {
      // Ensure we have a string representation of the error
      const errorMessage = error?.message || (error instanceof Error ? error.toString() : 'Unknown error');
      
      // Define interface for safe error details
      interface SafeErrorDetails {
        message: string;
        type: string;
        code?: string | number;
        name?: string;
        stack?: string;
      }
      
      // Create safe serializable error object
      const safeErrorDetails: SafeErrorDetails = {
        message: errorMessage,
        type: error?.constructor?.name || typeof error,
        name: error?.name,
        stack: error?.stack?.split('\n').slice(0, 3).join('\n')
      };
      
      console.error('Auto-save failed:', safeErrorDetails);
    }
  }, delay);
} 