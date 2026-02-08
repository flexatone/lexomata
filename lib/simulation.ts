import { Cell, CellState, Direction, GridSnapshot, NeighborInfo, SimulationConfig } from './types'

const DIRECTIONS: { dir: Direction; dr: number; dc: number }[] = [
  { dir: 'N',  dr: -1, dc: 0 },
  { dir: 'NE', dr: -1, dc: 1 },
  { dir: 'E',  dr: 0,  dc: 1 },
  { dir: 'SE', dr: 1,  dc: 1 },
  { dir: 'S',  dr: 1,  dc: 0 },
  { dir: 'SW', dr: 1,  dc: -1 },
  { dir: 'W',  dr: 0,  dc: -1 },
  { dir: 'NW', dr: -1, dc: -1 },
]

const STATES: CellState[] = ['dormant', 'calm', 'engaged', 'excited']

function wrap(val: number, size: number): number {
  return ((val % size) + size) % size
}

export function getNeighbors(grid: Cell[][], row: number, col: number): NeighborInfo[] {
  const size = grid.length
  return DIRECTIONS.map(({ dir, dr, dc }) => {
    const r = wrap(row + dr, size)
    const c = wrap(col + dc, size)
    const neighbor = grid[r][c]
    return { direction: dir, state: neighbor.state, proposal: neighbor.proposal }
  })
}

export function getRegionalStats(grid: Cell[][], row: number, col: number): Record<CellState, number> {
  const size = grid.length
  const stats: Record<CellState, number> = { dormant: 0, calm: 0, engaged: 0, excited: 0 }
  let total = 0
  for (let dr = -2; dr <= 2; dr++) {
    for (let dc = -2; dc <= 2; dc++) {
      const r = wrap(row + dr, size)
      const c = wrap(col + dc, size)
      stats[grid[r][c].state]++
      total++
    }
  }
  for (const s of STATES) {
    stats[s] = Math.round((stats[s] / total) * 100)
  }
  return stats
}

export function getGlobalStats(grid: Cell[][]): Record<CellState, number> {
  const stats: Record<CellState, number> = { dormant: 0, calm: 0, engaged: 0, excited: 0 }
  let total = 0
  for (const row of grid) {
    for (const cell of row) {
      stats[cell.state]++
      total++
    }
  }
  for (const s of STATES) {
    stats[s] = Math.round((stats[s] / total) * 100)
  }
  return stats
}

export function buildCellPrompt(
  cell: Cell,
  neighbors: NeighborInfo[],
  regionalStats: Record<CellState, number>,
  globalStats: Record<CellState, number>
): string {
  const neighborLines = neighbors
    .map(n => `- ${n.direction}: ${n.state}, proposes you become ${n.proposal}`)
    .join('\n')

  return `You are a cell in a grid. You want to experience excitement, but you also value your autonomy.

Your current state: ${cell.state}

Your immediate neighbors:
${neighborLines}

Your region (5x5): ${regionalStats.dormant}% dormant, ${regionalStats.calm}% calm, ${regionalStats.engaged}% engaged, ${regionalStats.excited}% excited
The whole grid: ${globalStats.dormant}% dormant, ${globalStats.calm}% calm, ${globalStats.engaged}% engaged, ${globalStats.excited}% excited

Valid states: dormant, calm, engaged, excited

Respond in exactly this format with no other text:
STATE: {your next state}
PROPOSAL: {what you want your neighbors to become}
REASONING: {one sentence why}`
}

export function parseResponse(response: string): Cell {
  const stateMatch = response.match(/STATE:\s*(dormant|calm|engaged|excited)/i)
  const proposalMatch = response.match(/PROPOSAL:\s*(dormant|calm|engaged|excited)/i)
  const reasoningMatch = response.match(/REASONING:\s*(.+)/i)

  const state = (stateMatch?.[1]?.toLowerCase() as CellState) ?? 'calm'
  const proposal = (proposalMatch?.[1]?.toLowerCase() as CellState) ?? 'calm'
  const reasoning = reasoningMatch?.[1]?.trim() ?? 'No reasoning provided.'

  return { state, proposal, reasoning }
}

export function initializeGrid(config: SimulationConfig): Cell[][] {
  const { gridSize, initialState, customInitialGrid } = config

  if (initialState === 'custom' && customInitialGrid) {
    return customInitialGrid.map(row =>
      row.map(state => ({ state, proposal: 'calm' as CellState, reasoning: 'Initial state.' }))
    )
  }

  const grid: Cell[][] = []
  for (let r = 0; r < gridSize; r++) {
    const row: Cell[] = []
    for (let c = 0; c < gridSize; c++) {
      let state: CellState = 'calm'

      if (initialState === 'random') {
        state = STATES[Math.floor(Math.random() * STATES.length)]
      } else if (initialState === 'center-excited') {
        const center = Math.floor(gridSize / 2)
        state = (r === center && c === center) ? 'excited' : 'calm'
      }
      // 'all-calm' uses the default 'calm'

      row.push({ state, proposal: 'calm', reasoning: 'Initial state.' })
    }
    grid.push(row)
  }
  return grid
}

export function createSnapshot(grid: Cell[][], tick: number): GridSnapshot {
  return {
    tick,
    cells: grid,
    globalStats: getGlobalStats(grid),
  }
}
