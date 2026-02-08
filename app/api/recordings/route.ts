import { NextResponse } from 'next/server'
import { listRecordings } from '@/lib/recordings'

export async function GET() {
  try {
    const recordings = listRecordings()
    return NextResponse.json({ recordings })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
