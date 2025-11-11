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

    const messages = chat.messages.map((m: any) => ({
      text: m.text,
      sender: m.sender as 'user' | 'ai',
      persona: m.persona ?? undefined,
      timestamp: m.timestamp?.toISOString(),
    }));

    const tabContent: Record<string, string> = {};
    for (const t of chat.tabContents as any[]) tabContent[t.tabType] = t.content;

    const tabContentGeneration: Record<string, string> = {};
    for (const g of chat.tabGenerations as any[]) tabContentGeneration[g.tabType] = g.status;

    const data: ChatData = {
      id: chat.id,
      projectId: chat.projectId,
      userId: chat.userId,
      messages,
      projectInfo: (chat.projectInfo as any) ?? {},
      persona: chat.persona ?? undefined,
      currentTab: chat.currentTab ?? undefined,
      tabContent,
      tabContentGeneration,
      createdAt: chat.createdAt?.toISOString(),
      updatedAt: chat.updatedAt?.toISOString(),
    };

    return NextResponse.json({ success: true, data });
    
  } catch (error: any) {
    // Create safe error details for logging
    const errorDetails = {
      message: error?.message || (error instanceof Error ? error.toString() : 'Unknown error'),
      type: error?.constructor?.name || typeof error,
      code: error?.code,
      name: error?.name
    };
    
    console.error('Error loading chat data:', errorDetails);
    
    // Send a more detailed error message back to the client
    return NextResponse.json(
      { 
        success: false, 
        error: errorDetails.message || 'Failed to load chat data',
        errorType: errorDetails.type
      },
      { status: 500 }
    );
  }
}
