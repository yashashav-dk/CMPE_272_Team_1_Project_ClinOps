import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Test Postgres connection via Prisma
    const ping = await prisma.$queryRaw<{ result: number }[]>`SELECT 1::int as result`;
    const tables = await prisma.$queryRaw<{ table_name: string }[]>`
      SELECT table_name FROM information_schema.tables WHERE table_schema='public'
    `;

    return NextResponse.json({
      success: true,
      message: 'API is working',
      database: {
        connected: true,
        ping: ping?.[0]?.result === 1,
        tables: tables.map((t: { table_name: string }) => t.table_name)
      }
    });
  } catch (error) {
    console.error('Test route error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `Failed to connect to database: ${error instanceof Error ? error.message : String(error)}`
      },
      { status: 500 }
    );
  }
}
