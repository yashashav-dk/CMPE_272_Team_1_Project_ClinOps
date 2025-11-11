import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(
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
    
    // Delete all chat histories for this project (children cascade via FKs)
    await prisma.chatHistory.deleteMany({ where: { projectId } });

    return NextResponse.json({
      success: true,
      data: { projectId },
      message: 'Chat data cleared successfully'
    });
    
  } catch (error: any) {
    // Create safe error details for logging
    const errorDetails = {
      message: error?.message || (error instanceof Error ? error.toString() : 'Unknown error'),
      type: error?.constructor?.name || typeof error,
      code: error?.code,
      name: error?.name
    };
    
    console.error('Error clearing chat data:', errorDetails);
    
    // Send a more detailed error message back to the client
    return NextResponse.json(
      { 
        success: false, 
        error: errorDetails.message || 'Failed to clear chat data',
        errorType: errorDetails.type
      },
      { status: 500 }
    );
  }
}
