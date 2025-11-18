import { NextRequest, NextResponse } from 'next/server'

const OTLP_URL = process.env.OTLP_HTTP_COLLECTOR_URL || process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT || 'http://localhost:4318/v1/traces'

export async function POST(req: NextRequest) {
  const body = await req.arrayBuffer()
  const res = await fetch(OTLP_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-protobuf',
    },
    body,
  })
  return new NextResponse(null, { status: res.status })
}
