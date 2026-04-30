export type CellState = 'dormant' | 'calm' | 'engaged' | 'excited'

export type Composition = number[] // 2-10 elements, each 0-7

export type Cell = {
  state: CellState
  composition: Composition
  phase: number
  colorIndex: number
  reasoning: string
  compositionAge: number
}

export type NeighborInfo = {
  direction: Direction
  state: CellState
  composition: Composition
  phase: number
  colorIndex: number
}

export type RegionalStats = {
  dominantComposition: Composition
  sameCompCount: number
  totalCount: number
  avgPhaseDiff: number
}

export type GlobalStats = {
  stateDistribution: Record<CellState, number>
  colorDistribution: Record<number, number> // palette index -> percentage
  compositionClusters: number
  avgPhaseCoherence: number
}

export type GridSnapshot = {
  tick: number
  cells: Cell[][]
  globalStats: GlobalStats
}

export type SimulationConfig = {
  gridSize: number
  llmModel: string
  llmTemperature: number
  inputCostPerMTok: number
  outputCostPerMTok: number
  thinkInterval: number
  initialState: 'random' | 'uniform' | 'gradient' | 'custom'
  customInitialGrid?: Cell[][]
}

export type Recording = {
  id: string
  title: string
  description: string
  config: SimulationConfig
  history: GridSnapshot[]
  totalTicks: number
  totalLLMCalls: number
  totalInputTokens?: number
  totalOutputTokens?: number
  estimatedCost: number
  createdAt: string
}

export type RecordingMetadata = Omit<Recording, 'history'>

export type RunStats = {
  totalTicks: number
  totalLLMCalls: number
  totalInputTokens: number
  totalOutputTokens: number
  estimatedCost: number
}

export type Direction = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW'
