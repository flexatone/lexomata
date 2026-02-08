'use client'

import { GridSnapshot } from '@/lib/types'
import { STATE_COLORS } from '@/lib/colors'

type Props = {
  history: GridSnapshot[]
  currentTick: number
  onSeek: (tick: number) => void
}

export default function Timeline({ history, currentTick, onSeek }: Props) {
  if (history.length === 0) return null

  const maxTick = history.length - 1

  return (
    <div className="space-y-1">
      {/* Scrubber */}
      <input
        type="range"
        min={0}
        max={maxTick}
        value={currentTick}
        onChange={e => onSeek(parseInt(e.target.value))}
        className="w-full"
      />

      {/* Excitement sparkline */}
      <svg viewBox={`0 0 ${history.length} 50`} className="h-8 w-full" preserveAspectRatio="none">
        {/* Sparkline */}
        <polyline
          fill="none"
          stroke={STATE_COLORS.excited}
          strokeWidth="1"
          points={history.map((snap, i) => `${i},${50 - (snap.globalStats.excited ?? 0) * 0.5}`).join(' ')}
        />
        {/* Current position indicator */}
        <line
          x1={currentTick}
          y1={0}
          x2={currentTick}
          y2={50}
          stroke="white"
          strokeWidth="0.5"
          opacity={0.6}
        />
      </svg>
    </div>
  )
}
