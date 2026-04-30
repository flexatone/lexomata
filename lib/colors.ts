import { CellState } from './types'

// 8-color palette for composition display (indexed 0-7), coherent gradient
export const PALETTE: string[] = [
  '#1e293b',  // 0: slate-800   (deep dark)
  '#1d4ed8',  // 1: blue-700
  '#0891b2',  // 2: cyan-600
  '#059669',  // 3: emerald-600
  '#65a30d',  // 4: lime-600
  '#eab308',  // 5: yellow-500
  '#ea580c',  // 6: orange-600
  '#dc2626',  // 7: red-600
]

// Mood dot colors (secondary display)
export const STATE_COLORS: Record<CellState, string> = {
  dormant: '#94a3b8',  // slate-400
  calm: '#60a5fa',     // blue-400
  engaged: '#fbbf24',  // amber-400
  excited: '#f43f5e',  // rose-500
}

export const STATE_BG_CLASSES: Record<CellState, string> = {
  dormant: 'bg-slate-400',
  calm: 'bg-blue-400',
  engaged: 'bg-amber-400',
  excited: 'bg-rose-500',
}

export const STATE_TEXT_CLASSES: Record<CellState, string> = {
  dormant: 'text-slate-400',
  calm: 'text-blue-400',
  engaged: 'text-amber-400',
  excited: 'text-rose-500',
}
