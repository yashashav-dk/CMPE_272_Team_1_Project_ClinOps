import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { callExternalAI } from '../../../../services/ai';
import * as crypto from 'crypto';

// Types matching the service interface
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

// Helper method to generate hash for caching
function generatePromptHash(prompt: string, userId: string, projectId?: string, persona?: string, tabType?: string): string {
  const contextString = `${prompt}|${userId}|${projectId || ''}|${persona || ''}|${tabType || ''}`;
  return crypto.createHash('sha256').update(contextString).digest('hex');
}

export async function POST(request: Request) {
  try {
    const body: AIGenerateOptions = await request.json();
    
    if (!body.prompt) {
      return NextResponse.json(
        { success: false, error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // For Next.js, we'll use a default user ID since there's no auth middleware
    const userId = 'default-user';
    
    console.log('AI generate request received:', { 
      promptLength: body.prompt.length, 
      forceRefresh: body.forceRefresh,
      projectId: body.projectId ? body.projectId.substring(0, 8) + '...' : 'none',
      persona: body.persona,
      tabType: body.tabType 
    });

    // Generate hash for caching
    const promptHash = generatePromptHash(body.prompt, userId, body.projectId, body.persona, body.tabType);

    // Check cache first if not forcing refresh
    if (!body.forceRefresh) {
      try {
        const cachedResponse = await prisma.aiResponseCache.findUnique({
          where: { promptHash },
        });

        if (cachedResponse) {
          console.log('Returning cached response for hash:', promptHash.substring(0, 8) + '...');
          return NextResponse.json({ 
            success: true, 
            response: cachedResponse.response,
            cached: true,
            cachedAt: cachedResponse.updatedAt
          });
        }
      } catch (cacheError) {
        console.warn('Cache lookup failed, proceeding with API call:', cacheError);
      }
    }

    // Generate new response from API with enhanced retry logic
    console.log('Generating new response from enhanced Gemini API');
    const aiResult = await callExternalAI(body.prompt, body.options);
    
    if (!aiResult.success) {
      throw new Error(aiResult.error || 'AI service failed');
    }

    const response = aiResult.response || '';
    
    // Cache the response
    try {
      await prisma.aiResponseCache.upsert({
        where: { promptHash },
        update: {
          prompt: body.prompt,
          response,
          userId,
          projectId: body.projectId ?? null,
          persona: body.persona ?? null,
          tabType: body.tabType ?? null,
        },
        create: {
          promptHash,
          prompt: body.prompt,
          response,
          userId,
          projectId: body.projectId ?? null,
          persona: body.persona ?? null,
          tabType: body.tabType ?? null,
        },
      });
      console.log('Response cached successfully');
    } catch (cacheError) {
      console.warn('Failed to cache response:', cacheError);
      // Don't fail the request if caching fails
    }

    console.log('Enhanced Gemini response received and cached successfully');
    return NextResponse.json({ 
      success: true, 
      response,
      cached: false
    });
  } catch (error: unknown) {
    console.error('Error in generateAIResponse:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate AI response';
    return NextResponse.json({ 
      success: false, 
      error: message
    }, { status: 500 });
  }
}

