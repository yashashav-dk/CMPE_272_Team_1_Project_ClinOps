import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import * as crypto from 'crypto';

// Interface for LLM providers
export interface LLMProvider {
  generateResponse(prompt: string, options?: any): Promise<string>;
}

// Gemini Provider implementation using the SDK
class GeminiProvider implements LLMProvider {
  private apiKey: string;
  private model: string = 'gemini-3-pro-preview';
  private maxRetries: number = 3;
  private retryDelay: number = 1000; // 1 second initial delay

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    if (!apiKey || apiKey.trim() === '') {
      console.error('GEMINI_API_KEY is missing or empty! Please check your environment variables.');
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private isRetryableError(error: any): boolean {
    // Retry on 503 Service Unavailable, rate limits, or other temporary errors
    const errorMessage = error?.message?.toLowerCase() || '';
    const errorCode = error?.code?.toLowerCase() || '';
    const errorString = error?.toString()?.toLowerCase() || '';
    
    return error?.status === 503 || 
           error?.status === 429 ||
           error?.status === 500 ||
           errorMessage.includes('service unavailable') ||
           errorMessage.includes('econnreset') ||
           errorMessage.includes('timeout') ||
           errorMessage.includes('rate limit') ||
           errorMessage.includes('too many requests') ||
           errorMessage.includes('enotfound') ||
           errorMessage.includes('network') ||
           errorMessage.includes('ssl') ||
           errorMessage.includes('tls') ||
           errorMessage.includes('bad record mac') ||
           errorMessage.includes('connection reset') ||
           errorMessage.includes('socket hang up') ||
           errorString.includes('tls') ||
           errorString.includes('ssl') ||
           errorCode.includes('econnreset') ||
           errorCode.includes('etimedout') ||
           errorCode.includes('enotfound') ||
           errorCode === 'err_ssl_wrong_version_number' ||
           errorCode === 'eproto';
  }

  async generateResponse(prompt: string, options?: any): Promise<string> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        if (!this.apiKey || this.apiKey.trim() === '') {
          throw new Error('Gemini API key is not configured');
        }
        
        // Create a client with the API key
        const genAI = new GoogleGenerativeAI(this.apiKey);
        
        // For text-only input, use the gemini-2.0-flash model
        const model = genAI.getGenerativeModel({ model: this.model });

        // Set safety settings (optional)
        const safetySettings = [
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
        ];

        // Generate content
        const generationConfig = {
          temperature: options?.temperature || 0.7,
          topK: options?.topK || 40,
          topP: options?.topP || 0.95,
          maxOutputTokens: options?.maxTokens ?? 88192,
        };

        console.log(`Attempt ${attempt}/${this.maxRetries} - Sending request to Gemini API`);
        console.log('Using model:', this.model);
        
        // Create the content with the proper role field
        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig,
          safetySettings,
        });

        const response = result.response;
        return response.text();
      } catch (error: any) {
        lastError = error;
        console.error(`Attempt ${attempt}/${this.maxRetries} - Error generating response from Gemini:`, error);
        
        if (this.isRetryableError(error) && attempt < this.maxRetries) {
          // Exponential backoff
          const backoffTime = this.retryDelay * Math.pow(2, attempt - 1);
          console.log(`Service unavailable (503), retrying in ${backoffTime}ms...`);
          await this.delay(backoffTime);
          continue;
        }
        break;
      }
    }

    // All retries failed or non-retryable error
    console.error('All attempts failed or non-retryable error');
    console.error('Error details:', JSON.stringify(lastError, null, 2));
    
    if (lastError?.status === 503) {
      throw new Error('Gemini API service is currently unavailable. Please try again later.');
    } else {
      throw new Error(`Failed to generate AI response: ${lastError?.message || 'Unknown error'}`);
    }
  }
}

// Simple fallback provider when external APIs are unavailable
class FallbackProvider implements LLMProvider {
  async generateResponse(prompt: string, options?: any): Promise<string> {
    console.log('Using fallback response mechanism');
    
    // Return a simple message acknowledging the system is in fallback mode
    return `I'm currently operating in fallback mode due to API unavailability. 
    
Your request has been received, but I cannot process it through the AI model at this time.

Please try again later when the service is available, or contact support if this issue persists.`;
  }
}

// LLM Service with provider factory and fallback mechanism
class LLMService {
  private provider: LLMProvider;
  private fallbackProvider: LLMProvider;
  private usesFallback: boolean = false;
  
  constructor() {
    // Get the API key from environment variables (support both formats)
    const geminiApiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY || '';
    
    if (!geminiApiKey) {
      console.warn('WARNING: No Gemini API key found. Set GOOGLE_GENERATIVE_AI_API_KEY in your .env file');
    }
    
    // Initialize providers
    this.provider = new GeminiProvider(geminiApiKey);
    this.fallbackProvider = new FallbackProvider();
  }

  // Method to switch provider if needed in the future
  setProvider(provider: LLMProvider): void {
    this.provider = provider;
  }
  
  // Check if currently using fallback
  get isFallbackActive(): boolean {
    return this.usesFallback;
  }

  async generateResponse(prompt: string, options?: any): Promise<string> {
    try {
      // First try with the primary provider
      return await this.provider.generateResponse(prompt, options);
    } catch (error: any) {
      console.error('Primary AI provider failed, considering fallback:', error);
      
      // Only use fallback for configuration errors, not for general errors
      if (error.message?.includes('not configured') || 
          error.message?.includes('API key') || 
          error.message?.includes('missing key')) {
        
        console.log('Switching to fallback provider due to configuration issue');
        this.usesFallback = true;
        return this.fallbackProvider.generateResponse(prompt, options);
      }
      
      // For other errors, throw them for proper handling upstream
      throw error;
    }
  }
}

// Singleton instance of LLM service
const llmService = new LLMService();

// Export the service for use in other files
export { llmService };

// Helper function to generate hash for caching
export function generatePromptHash(prompt: string, userId: string = 'default-user', projectId?: string, persona?: string, tabType?: string): string {
  const contextString = `${prompt}|${userId}|${projectId || ''}|${persona || ''}|${tabType || ''}`;
  return crypto.createHash('sha256').update(contextString).digest('hex');
}
