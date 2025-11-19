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
    
  } catch (error: unknown) {
    // Create safe error details for logging
    let message = 'Failed to clear chat data';
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
    
    console.error('Error clearing chat data:', errorDetails);
    
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
