import { llmService } from './controller/AIController';

interface AIResponseOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
}

interface AIGenerateOptions {
  prompt: string;
  options?: AIResponseOptions;
  forceRefresh?: boolean;
  projectId?: string;
  persona?: string;
  tabType?: string;
}

interface AIResponseResult {
  success: boolean;
  response?: string;
  error?: string;
  cached?: boolean;
  cachedAt?: string;
}

/**
 * Generate a response from the Gemini AI service with caching and retry logic
 * @param prompt The prompt to send to the AI
 * @param options Additional options for the AI response generation
 * @returns Promise with the AI response
 */
export async function callExternalAI(
  prompt: string,
  options?: AIResponseOptions
): Promise<AIResponseResult> {
  try {
    console.log('Generating AI response using enhanced Gemini service');

    // Use the LLM service with retry logic
    const response = await llmService.generateResponse(prompt, options);

    return {
      success: true,
      response,
      cached: false
    };
  } catch (error: any) {
    console.error('Error calling enhanced Gemini service:', error);

    return {
      success: false,
      error: error.message || 'Failed to generate AI response'
    };
  }
}

/**
 * Generate a response from the AI - used by API routes
 * @param prompt The user's prompt to send to the AI or full options object
 * @param options Additional options for the AI response generation (deprecated, use options object)
 * @returns Promise with the AI response
 */
export async function generateAIResponse(
  prompt: string | AIGenerateOptions,
  options?: AIResponseOptions
): Promise<AIResponseResult> {
  // Handle both old and new API formats
  let requestData: AIGenerateOptions;

  if (typeof prompt === 'string') {
    // Legacy format
    requestData = {
      prompt,
      options,
      forceRefresh: false
    };
  } else {
    // New format with caching options
    requestData = prompt;
  }

  console.log('Generating AI response for:', {
    promptLength: requestData.prompt.length,
    forceRefresh: requestData.forceRefresh,
    projectId: requestData.projectId ? requestData.projectId.substring(0, 8) + '...' : 'none',
    persona: requestData.persona,
    tabType: requestData.tabType
  });

  // Call the external AI service
  return callExternalAI(requestData.prompt, requestData.options);
}

/**
 * Simple wrapper for chat-based interactions
 * @param messages Array of messages in the conversation
 * @param options Additional options for the AI response generation
 * @returns Promise with the AI response
 */
export async function chatWithAI(
  messages: { role: 'user' | 'system' | 'assistant'; content: string }[],
  options?: AIResponseOptions
): Promise<AIResponseResult> {
  // Convert messages to a single prompt
  // This is a simple implementation - in a real app, you might want
  // to format this differently or have the backend handle the formatting
  const prompt = messages
    .map(msg => `${msg.role.toUpperCase()}: ${msg.content}`)
    .join('\n\n');

  return generateAIResponse(prompt, options);
} 