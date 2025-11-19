import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ChatData } from '../../../../../services/aiChat';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    
    if (!projectId) {
      return NextResponse.json(
        { success: false, error: 'Project ID is required' },
        { status: 400 }
      );
    }
    
    // Load the most recent chat history for this project
    const chat = await prisma.chatHistory.findFirst({
      where: { projectId },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: { orderBy: { timestamp: 'asc' } },
        tabContents: true,
        tabGenerations: true,
      },
    });

    if (!chat) {
      return NextResponse.json({
        success: true,
        data: {
          projectId,
          userId: '',
          messages: [],
          projectInfo: {},
          persona: '',
          currentTab: '',
          tabContent: {},
          tabContentGeneration: {},
        } satisfies ChatData,
      });
    }

    const messages = chat.messages.map(m => ({
      text: m.text,
      sender: m.sender as 'user' | 'ai',
      persona: m.persona ?? undefined,
      timestamp: m.timestamp?.toISOString(),
    }));

    const tabContent: Record<string, string> = {};
    for (const t of chat.tabContents) {
      tabContent[t.tabType] = t.content;
    }

    const tabContentGeneration: Record<string, string> = {};
    for (const g of chat.tabGenerations) {
      tabContentGeneration[g.tabType] = g.status;
    }

    const data: ChatData = {
      id: chat.id,
      projectId: chat.projectId,
      userId: chat.userId,
      messages,
      projectInfo: chat.projectInfo as Record<string, any> ?? {},
      persona: chat.persona ?? undefined,
      currentTab: chat.currentTab ?? undefined,
      tabContent,
      tabContentGeneration,
      createdAt: chat.createdAt?.toISOString(),
      updatedAt: chat.updatedAt?.toISOString(),
    };

    return NextResponse.json({ success: true, data });
    
  } catch (error: unknown) {
    // Create safe error details for logging
    let message = 'Failed to load chat data';
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

    console.error('Error loading chat data:', errorDetails);
    
    // Send a more detailed error message back to the client
    return NextResponse.json(
      { 
        success: false, 
        error: message,
        errorType: type
      },
      { status: 500 }
    );
  }
}
