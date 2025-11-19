import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import * as crypto from 'crypto';

export async function POST(request: Request) {
  try {
    // Log raw request info for debugging
    console.log('Request headers:', Object.fromEntries(request.headers.entries()));

    // For improved robustness, try multiple approaches to get the body
    let body;
    let rawBody;
    
    // First try the standard request.json() method
    try {
      body = await request.json();
    } catch (jsonError) {
      console.log('Standard JSON parsing failed, trying text parsing...', jsonError);
      
      // If that fails, get the raw text and try to parse it
      try {
        const clonedRequest = request.clone();
        rawBody = await clonedRequest.text();
        console.log('Raw request body received:', rawBody);
        
        // Only try to parse if there's actually content and looks like JSON
        if (rawBody && rawBody.trim()) {
          // Check if it looks like a JSON object or array
          if ((rawBody.trim().startsWith('{') && rawBody.trim().endsWith('}')) || 
              (rawBody.trim().startsWith('[') && rawBody.trim().endsWith(']'))) {
            body = JSON.parse(rawBody);
          } else {
            console.log('Content does not appear to be valid JSON, received:', rawBody);
            return NextResponse.json({
              success: false,
              error: 'Received content is not in valid JSON format'
            }, { status: 400 });
          }
        } else {
          console.log('Empty request body received');
          return NextResponse.json({
            success: false,
            error: 'Empty request body received'
          }, { status: 400 });
        }
      } catch (parseError: unknown) {
        console.error('Error parsing JSON:', parseError);
        const message = parseError instanceof Error ? parseError.message : 'Invalid JSON';
        return NextResponse.json({
          success: false,
          error: `Error parsing request body: ${message}`,
          receivedData: rawBody?.substring(0, 100) // Include the first portion of what was received for debugging
        }, { status: 400 });
      }
    }

    // Extract necessary fields
    const { projectId, userId = 'default-user', messages, projectInfo, persona, currentTab, tabContent, tabContentGeneration } = body;

    // Validate required parameters
    if (!projectId || !userId) {
      return NextResponse.json({
        success: false,
        error: 'Project ID and user ID are required'
      }, { status: 400 });
    }

    console.log(`Extracted projectId: ${projectId}`);
    console.log(`Extracted userId: ${userId}`);

    const chatId = crypto.randomUUID();

    await prisma.$transaction(async (tx: any) => {
      // Ensure project exists (Project.userId is required in schema)
      await tx.project.upsert({
        where: { id: projectId },
        update: { name: `Project ${projectId}`, description: 'Auto-generated project for chat data', userId },
        create: { id: projectId, userId, name: `Project ${projectId}`, description: 'Auto-generated project for chat data' },
      });

      // Create chat history row
      await tx.chatHistory.create({
        data: {
          id: chatId,
          projectId,
          userId,
          persona: persona ?? null,
          currentTab: currentTab ?? null,
          projectInfo: projectInfo ?? null,
        },
      });

      // Save messages
      if (messages?.length) {
        for (const m of messages) {
          await tx.message.create({
            data: {
              id: crypto.randomUUID(),
              chatId,
              text: m.text,
              sender: m.sender,
              persona: m.persona ?? null,
              timestamp: m.timestamp ? new Date(m.timestamp) : undefined,
            },
          });
        }
      }

      // Save tab content (replace existing for this chat)
      if (tabContent) {
        const entries = Object.entries(tabContent as Record<string, string>);
        for (const [tabTypeKey, content] of entries) {
          await tx.tabContent.create({
            data: {
              id: crypto.randomUUID(),
              chatId,
              tabType: tabTypeKey,
              content,
            },
          });
        }
      }

      // Save tab content generation (replace existing for this chat)
      if (tabContentGeneration) {
        const genEntries = Object.entries(tabContentGeneration as Record<string, string>);
        for (const [tabTypeKey, status] of genEntries) {
          await tx.tabContentGeneration.create({
            data: {
              id: crypto.randomUUID(),
              chatId,
              tabType: tabTypeKey,
              status,
            },
          });
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: chatId,
        projectId,
        userId,
        messages: messages || [],
        projectInfo: projectInfo || {},
        persona: persona || '',
        currentTab: currentTab || '',
        tabContent: tabContent || {},
        tabContentGeneration: tabContentGeneration || {},
      }
    });

  } catch (error: unknown) {
    // Create safe error details for logging
    let message = 'Failed to save chat data';
    let type: string = typeof error;
    let code: string | undefined;
    let name: string | undefined;

    if (error instanceof Error) {
      message = error.message || message;
      type = error.constructor.name || type;
      name = error.name;
    } else if (typeof error === 'object' && error !== null) {
      const errObj = error as { message?: string; code?: string; name?: string; constructor?: { name?: string } };
      message = errObj.message || message;
      type = errObj.constructor?.name || type;
      code = errObj.code;
      name = errObj.name;
    }

    const errorDetails = { message, type, code, name };
    
    console.error('Error saving chat data:', errorDetails);
    
    return NextResponse.json({
      success: false,
      error: message,
      errorType: type
    }, { status: 500 });
  }
}
