import { NextRequest, NextResponse } from 'next/server'

let feedbackCounts = { up: 0, down: 0 }

export async function POST(req: NextRequest) {
  const body = await req.json()
  const type: 'up' | 'down' = body.type

  if (type === 'up' || type === 'down') {
    feedbackCounts[type] += 1
    console.log('Feedback counts:', feedbackCounts)
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ success: false, message: 'Invalid type' }, { status: 400 })
}
