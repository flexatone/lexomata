import { NextRequest, NextResponse } from 'next/server'
import { saveRecording } from '@/lib/recordings'

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Save is only available in development' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { title, description, config, history, totalTicks, totalLLMCalls, estimatedCost } = body

    const id = saveRecording({
      title,
      description,
      config,
      history,
      totalTicks,
      totalLLMCalls,
      estimatedCost,
      createdAt: new Date().toISOString(),
    })

    return NextResponse.json({ id, path: `recordings/${id}.json` })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
