import { NextRequest, NextResponse } from 'next/server'
import { getRecording } from '@/lib/recordings'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const recording = getRecording(id)
    if (!recording) {
      return NextResponse.json({ error: 'Recording not found' }, { status: 404 })
    }
    return NextResponse.json({ recording })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
