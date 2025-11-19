import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await params;
    const userId = 'default-user'; // For Next.js without auth middleware

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: 'Project ID is required' },
        { status: 400 }
      );
    }

    await prisma.aiResponseCache.deleteMany({ where: { projectId, userId } });

    return NextResponse.json({ 
      success: true, 
      message: 'AI response cache cleared successfully for project' 
    });
  } catch (error: unknown) {
    console.error('Error clearing cache data:', error);
    const message = error instanceof Error ? error.message : 'Failed to clear cache data';
    return NextResponse.json({ 
      success: false, 
      error: message
    }, { status: 500 });
  }
}
