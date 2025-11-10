'use client'

import { req } from './_req';

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
 * Client-side AI service that makes API calls to server endpoints
 * This replaces direct server-side service calls from client components
 */

/**
 * Generate a response from the AI - client-side version that calls API routes
 * @param prompt The user's prompt to send to the AI or full options object
 * @param options Additional options for the AI response generation
 * @returns Promise with the AI response
 */
export async function generateAIResponse(
  prompt: string | AIGenerateOptions,
  options?: AIResponseOptions
): Promise<AIResponseResult> {
  try {
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
    
    console.log('Client: Generating AI response via API for:', {
      promptLength: requestData.prompt.length,
      forceRefresh: requestData.forceRefresh,
      projectId: requestData.projectId ? requestData.projectId.substring(0, 8) + '...' : 'none',
      persona: requestData.persona,
      tabType: requestData.tabType
    });
    
    // Make API call to server-side endpoint
    const response = await req.post('/api/ai/generate', requestData);
    
    return response;
  } catch (error: any) {
    console.error('Client: Error calling AI API:', error);
    
    return {
      success: false,
      error: error?.response?.data?.error || error.message || 'Failed to generate AI response'
    };
  }
}

/**
 * Simple wrapper for chat-based interactions - client-side version
 * @param messages Array of messages in the conversation
 * @param options Additional options for the AI response generation
 * @returns Promise with the AI response
 */
export async function chatWithAI(
  messages: { role: 'user' | 'system' | 'assistant'; content: string }[],
  options?: AIResponseOptions
): Promise<AIResponseResult> {
  // Convert messages to a single prompt
  const prompt = messages
    .map(msg => `${msg.role.toUpperCase()}: ${msg.content}`)
    .join('\n\n');
  
  return generateAIResponse(prompt, options);
}
