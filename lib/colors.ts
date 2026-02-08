import { CellState } from './types'

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
