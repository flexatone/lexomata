import { NextRequest, NextResponse } from 'next/server'
import { initializeGrid, createSnapshot } from '@/lib/simulation'
import { SimulationConfig } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { config } = body as { config: SimulationConfig }
    const grid = initializeGrid(config)
    const snapshot = createSnapshot(grid, 0)
    return NextResponse.json({ snapshot })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
