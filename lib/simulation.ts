import { Cell, CellState, Composition, Direction, GlobalStats, GridSnapshot, NeighborInfo, RegionalStats, SimulationConfig } from './types'

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

const MAX_UNIQUE_COLORS = 4

function randomComposition(): Composition {
  const length = 2 + Math.floor(Math.random() * 9) // 2-10
  const paletteSize = 1 + Math.floor(Math.random() * MAX_UNIQUE_COLORS) // 1-4 unique colors
  const palette = Array.from({ length: 8 }, (_, i) => i)
    .sort(() => Math.random() - 0.5)
    .slice(0, paletteSize)
  return Array.from({ length }, () => palette[Math.floor(Math.random() * palette.length)])
}

function compositionKey(comp: Composition): string {
  return comp.join(',')
}

function compositionsEqual(a: Composition, b: Composition): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i])
}

export function getNeighbors(grid: Cell[][], row: number, col: number): NeighborInfo[] {
  const size = grid.length
  return DIRECTIONS.map(({ dir, dr, dc }) => {
    const r = wrap(row + dr, size)
    const c = wrap(col + dc, size)
    const neighbor = grid[r][c]
    return {
      direction: dir,
      state: neighbor.state,
      composition: neighbor.composition,
      phase: neighbor.phase,
      colorIndex: neighbor.colorIndex,
    }
  })
}

export function getRegionalStats(grid: Cell[][], row: number, col: number): RegionalStats {
  const size = grid.length
  const centerCell = grid[row][col]
  const compCounts = new Map<string, { comp: Composition; count: number }>()
  let sameCompCount = 0
  let phaseDiffSum = 0
  let sameCompNeighborCount = 0
  let totalCount = 0

  for (let dr = -2; dr <= 2; dr++) {
    for (let dc = -2; dc <= 2; dc++) {
      const r = wrap(row + dr, size)
      const c = wrap(col + dc, size)
      const cell = grid[r][c]
      totalCount++

      const key = compositionKey(cell.composition)
      const entry = compCounts.get(key)
      if (entry) {
        entry.count++
      } else {
        compCounts.set(key, { comp: cell.composition, count: 1 })
      }

      if (compositionsEqual(cell.composition, centerCell.composition) && !(dr === 0 && dc === 0)) {
        sameCompCount++
        const phaseDiff = Math.abs(cell.phase - centerCell.phase)
        const wrappedDiff = Math.min(phaseDiff, centerCell.composition.length - phaseDiff)
        phaseDiffSum += wrappedDiff
        sameCompNeighborCount++
      }
    }
  }

  // Find dominant composition
  let dominantComp = centerCell.composition
  let maxCount = 0
  for (const { comp, count } of compCounts.values()) {
    if (count > maxCount) {
      maxCount = count
      dominantComp = comp
    }
  }

  const avgPhaseDiff = sameCompNeighborCount > 0 ? phaseDiffSum / sameCompNeighborCount : 0

  return {
    dominantComposition: dominantComp,
    sameCompCount,
    totalCount,
    avgPhaseDiff: Math.round(avgPhaseDiff * 10) / 10,
  }
}

export function getGlobalStats(grid: Cell[][]): GlobalStats {
  const stateDistribution: Record<CellState, number> = { dormant: 0, calm: 0, engaged: 0, excited: 0 }
  const colorCounts: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 }
  const compCounts = new Map<string, number>()
  let total = 0
  let phaseCoherenceSum = 0
  let phaseCoherencePairs = 0

  for (const row of grid) {
    for (const cell of row) {
      stateDistribution[cell.state]++
      colorCounts[cell.colorIndex] = (colorCounts[cell.colorIndex] ?? 0) + 1
      const key = compositionKey(cell.composition)
      compCounts.set(key, (compCounts.get(key) ?? 0) + 1)
      total++
    }
  }

  // Compute phase coherence: for each pair of same-composition neighbors, measure phase similarity
  const size = grid.length
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const cell = grid[r][c]
      // Check right and down neighbors to avoid double-counting
      for (const [dr, dc] of [[0, 1], [1, 0]] as const) {
        const nr = wrap(r + dr, size)
        const nc = wrap(c + dc, size)
        const neighbor = grid[nr][nc]
        if (compositionsEqual(cell.composition, neighbor.composition)) {
          const len = cell.composition.length
          const diff = Math.abs(cell.phase - neighbor.phase)
          const wrappedDiff = Math.min(diff, len - diff)
          // Coherence = 1 when phases differ by exactly 1 (ideal wave), 0 when identical or max diff
          const idealDiff = 1
          const maxDiff = Math.floor(len / 2)
          const coherence = maxDiff > 0 ? 1 - Math.abs(wrappedDiff - idealDiff) / maxDiff : 1
          phaseCoherenceSum += coherence
          phaseCoherencePairs++
        }
      }
    }
  }

  // Convert counts to percentages
  for (const s of STATES) {
    stateDistribution[s] = Math.round((stateDistribution[s] / total) * 100)
  }
  const colorDistribution: Record<number, number> = {}
  for (let i = 0; i < 8; i++) {
    colorDistribution[i] = Math.round(((colorCounts[i] ?? 0) / total) * 100)
  }

  return {
    stateDistribution,
    colorDistribution,
    compositionClusters: compCounts.size,
    avgPhaseCoherence: phaseCoherencePairs > 0
      ? Math.round((phaseCoherenceSum / phaseCoherencePairs) * 100) / 100
      : 0,
  }
}

export function buildSystemPrompt(): string {
  return `You are a cell in a visual grid automaton. Your goal: collaborate with neighbors to create beautiful cyclical color patterns — waves, rings, pulses.

Each cell has a composition (sequence of 2-10 palette indices, each 0-7, max 4 unique colors, repeats allowed) and a phase (position in that sequence). Phase advances by 1 each tick, wrapping at composition length. Displayed color = composition[phase]. Patterns emerge when nearby cells share the SAME composition but have DIFFERENT phases.

Forming clusters (neighbors sharing your composition) is valuable. But holding the same composition too long causes stagnation — when your held count is high, consider innovating with a new composition or joining a different nearby cluster.

Response format (exactly):
COMPOSITION: [n,n,...] (2-10 values, each 0-7, max 4 unique colors)
OFFSET: {-1|0|1}
REASONING: {one sentence}`
}

export function buildCellPrompt(
  cell: Cell,
  neighbors: NeighborInfo[],
  regionalStats: RegionalStats,
  globalStats: GlobalStats
): string {
  const neighborLines = neighbors.map(n => {
    const sameComp = compositionsEqual(n.composition, cell.composition)
    return `- ${n.direction}: comp=[${n.composition}] phase=${n.phase} color=${n.colorIndex} mood=${n.state}${sameComp ? ' [SAME COMP]' : ''}`
  }).join('\n')

  return `YOUR STATE: composition=[${cell.composition}] phase=${cell.phase} color=${cell.colorIndex} mood=${cell.state} held=${cell.compositionAge} think cycles

NEIGHBORS:
${neighborLines}

REGION: dominant composition=[${regionalStats.dominantComposition}], same-comp neighbors=${regionalStats.sameCompCount}/${regionalStats.totalCount}, avg phase diff=${regionalStats.avgPhaseDiff}
GRID: ${globalStats.compositionClusters} composition clusters, phase coherence=${globalStats.avgPhaseCoherence}`
}

export function parseResponse(response: string, previousCell: Cell): Cell {
  // Parse composition
  const compMatch = response.match(/COMPOSITION:\s*\[([0-7](?:\s*,\s*[0-7])*)\]/i)
  let composition = previousCell.composition
  if (compMatch) {
    const parsed = compMatch[1].split(',').map(s => parseInt(s.trim()))
    const uniqueColors = new Set(parsed).size
    if (parsed.length >= 2 && parsed.length <= 10 && parsed.every(v => v >= 0 && v <= 7) && uniqueColors <= MAX_UNIQUE_COLORS) {
      composition = parsed
    }
  }

  // Parse offset
  const offsetMatch = response.match(/OFFSET:\s*(-1|0|1|\+1)/i)
  const offset = offsetMatch ? parseInt(offsetMatch[1]) : 0

  // Parse reasoning
  const reasoningMatch = response.match(/REASONING:\s*(.+)/i)
  const reasoning = reasoningMatch?.[1]?.trim() ?? 'No reasoning provided.'

  // Auto-advance phase by 1 + apply offset
  const rawPhase = previousCell.phase + 1 + offset
  const phase = ((rawPhase % composition.length) + composition.length) % composition.length
  const colorIndex = composition[phase]

  const compositionAge = compositionsEqual(composition, previousCell.composition)
    ? previousCell.compositionAge + 1
    : 0

  return { state: previousCell.state, composition, phase, colorIndex, reasoning, compositionAge }
}

export function initializeGrid(config: SimulationConfig): Cell[][] {
  const { gridSize, initialState, customInitialGrid } = config

  if (initialState === 'custom' && customInitialGrid) {
    return customInitialGrid
  }

  const grid: Cell[][] = []
  for (let r = 0; r < gridSize; r++) {
    const row: Cell[] = []
    for (let c = 0; c < gridSize; c++) {
      let composition: Composition
      let phase: number

      if (initialState === 'uniform') {
        composition = [0, 1, 2, 3, 4, 5, 6, 7]
        phase = 0
      } else if (initialState === 'gradient') {
        composition = [0, 1, 2, 3, 4, 5, 6, 7]
        phase = (r + c) % composition.length
      } else {
        // 'random'
        composition = randomComposition()
        phase = Math.floor(Math.random() * composition.length)
      }

      const colorIndex = composition[phase]

      row.push({ state: 'dormant', composition, phase, colorIndex, reasoning: 'Initial state.', compositionAge: 0 })
    }
    grid.push(row)
  }
  return computeMoods(grid)
}

export function computeMoods(grid: Cell[][]): Cell[][] {
  const size = grid.length
  return grid.map((row, r) =>
    row.map((cell, c) => {
      let sameCount = 0
      for (const { dr, dc } of DIRECTIONS) {
        const nr = wrap(r + dr, size)
        const nc = wrap(c + dc, size)
        if (compositionsEqual(grid[nr][nc].composition, cell.composition)) sameCount++
      }
      // 0 → dormant, 1-2 → calm, 3-5 → engaged, 6-8 → excited
      const state: CellState =
        sameCount === 0 ? 'dormant' :
        sameCount <= 2 ? 'calm' :
        sameCount <= 5 ? 'engaged' : 'excited'
      return state === cell.state ? cell : { ...cell, state }
    })
  )
}

export function advancePhases(grid: Cell[][]): Cell[][] {
  return grid.map(row =>
    row.map(cell => {
      const phase = (cell.phase + 1) % cell.composition.length
      return { ...cell, phase, colorIndex: cell.composition[phase] }
    })
  )
}

export function createSnapshot(grid: Cell[][], tick: number): GridSnapshot {
  return {
    tick,
    cells: grid,
    globalStats: getGlobalStats(grid),
  }
}
