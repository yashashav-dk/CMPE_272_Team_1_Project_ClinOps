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
    
    // First, try to read as text (works better with sendBeacon)
    try {
      rawBody = await request.text();
      
      // Check if body is empty
      if (!rawBody || !rawBody.trim()) {
        console.log('Empty request body received, returning success for beacon requests');
        // Return success for empty beacon requests (prevents errors on page unload)
        return NextResponse.json({
          success: true,
          message: 'No data to save'
        }, { status: 200 });
      }
      
      // Try to parse the text as JSON
      body = JSON.parse(rawBody);
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      console.log('Raw body:', rawBody?.substring(0, 200));
      
      // Return success for malformed beacon requests to avoid errors
      return NextResponse.json({
        success: true,
        message: 'Could not parse request data'
      }, { status: 200 });
    }
    
    // If we got here with no body, return success
    if (!body) {
      return NextResponse.json({
        success: true,
        message: 'No data to save'
      }, { status: 200 });
    }
    
    // Validate we have required fields (if body exists)
    if (!body.projectId || !body.userId) {
      console.error('Missing required fields:', { 
        hasProjectId: !!body.projectId, 
        hasUserId: !!body.userId 
      });
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: projectId or userId'
      }, { status: 400 });
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
      // Only update updatedAt on existing projects, don't overwrite name/description
      await tx.project.upsert({
        where: { id: projectId },
        update: { 
          // Just update timestamp to track activity, preserve name and description
          updatedAt: new Date()
        },
        create: { 
          id: projectId, 
          userId, 
          name: `Project ${projectId.slice(-8)}`, 
          description: 'Created from chat session' 
        },
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
