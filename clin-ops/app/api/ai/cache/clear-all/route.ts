import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(request: Request) {
  try {
    const userId = 'default-user'; // For Next.js without auth middleware

    await prisma.aiResponseCache.deleteMany({ where: { userId } });

    return NextResponse.json({ 
      success: true, 
      message: 'All AI response cache cleared successfully' 
    });
  } catch (error: unknown) {
    console.error('Error clearing all cache data:', error);
    const message = error instanceof Error ? error.message : 'Failed to clear all cache data';
    return NextResponse.json({ 
      success: false, 
      error: message
    }, { status: 500 });
  }
}
