import { NextRequest, NextResponse } from 'next/server'
import { processGrid } from '@/lib/llm'
import { advancePhases, createSnapshot } from '@/lib/simulation'
import { Cell, SimulationConfig } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { currentGrid, config, tick } = body as {
      currentGrid: Cell[][]
      config: SimulationConfig
      tick: number
    }

    const interval = config.thinkInterval ?? 20
    const isThinkTick = tick % interval === 0

    if (isThinkTick) {
      const { grid: newGrid, llmCalls, inputTokens, outputTokens } = await processGrid(currentGrid, config)
      const snapshot = createSnapshot(newGrid, tick)
      return NextResponse.json({ snapshot, llmCalls, inputTokens, outputTokens })
    } else {
      const newGrid = advancePhases(currentGrid)
      const snapshot = createSnapshot(newGrid, tick)
      return NextResponse.json({ snapshot, llmCalls: 0, inputTokens: 0, outputTokens: 0 })
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
