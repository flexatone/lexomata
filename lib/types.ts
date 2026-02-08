export type CellState = 'dormant' | 'calm' | 'engaged' | 'excited'

export type Cell = {
  state: CellState
  proposal: CellState
  reasoning: string
}

export type GridSnapshot = {
  tick: number
  cells: Cell[][]
  globalStats: Record<CellState, number>
}

export type SimulationConfig = {
  gridSize: number
  llmModel: string
  llmTemperature: number
  initialState: 'random' | 'center-excited' | 'all-calm' | 'custom'
  customInitialGrid?: CellState[][]
}

export type Recording = {
  id: string
  title: string
  description: string
  config: SimulationConfig
  history: GridSnapshot[]
  totalTicks: number
  totalLLMCalls: number
  estimatedCost: number
  createdAt: string
}

export type RecordingMetadata = Omit<Recording, 'history'>

export type RunStats = {
  totalTicks: number
  totalLLMCalls: number
  estimatedCost: number
}

export type Direction = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW'

export type NeighborInfo = {
  direction: Direction
  state: CellState
  proposal: CellState
}
