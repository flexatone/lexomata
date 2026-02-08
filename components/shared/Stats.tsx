'use client'

import { CellState, GridSnapshot, RunStats } from '@/lib/types'
import { STATE_COLORS } from '@/lib/colors'

type Props = {
  snapshot: GridSnapshot | null
  runStats?: RunStats
  history?: GridSnapshot[]
}

const STATES: CellState[] = ['dormant', 'calm', 'engaged', 'excited']

export default function Stats({ snapshot, runStats, history }: Props) {
  if (!snapshot) return null

  const stats = snapshot.globalStats
  const total = Object.values(stats).reduce((a, b) => a + b, 0) || 1

  return (
    <div className="space-y-4 text-sm">
      {/* Distribution bar */}
      <div>
        <p className="mb-1 font-medium text-zinc-700 dark:text-zinc-300">State Distribution</p>
        <div className="flex h-6 w-full overflow-hidden rounded">
          {STATES.map(s => {
            const pct = stats[s] ?? 0
            if (pct === 0) return null
            return (
              <div
                key={s}
                style={{ width: `${pct}%`, backgroundColor: STATE_COLORS[s] }}
                className="flex items-center justify-center text-[10px] font-medium text-white"
                title={`${s}: ${pct}%`}
              >
                {pct > 8 ? `${pct}%` : ''}
              </div>
            )
          })}
        </div>
        <div className="mt-1 flex gap-3">
          {STATES.map(s => (
            <span key={s} className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: STATE_COLORS[s] }} />
              <span className="text-zinc-500 dark:text-zinc-400">{s}: {stats[s]}%</span>
            </span>
          ))}
        </div>
      </div>

      {/* Run stats */}
      {runStats && (
        <div className="flex gap-4 text-zinc-500 dark:text-zinc-400">
          <span>Tick: {snapshot.tick}</span>
          <span>LLM calls: {runStats.totalLLMCalls}</span>
          <span>~${runStats.estimatedCost.toFixed(4)}</span>
        </div>
      )}

      {/* Excitement sparkline */}
      {history && history.length > 1 && (
        <div>
          <p className="mb-1 font-medium text-zinc-700 dark:text-zinc-300">Excitement over time</p>
          <svg viewBox={`0 0 ${history.length} 100`} className="h-12 w-full" preserveAspectRatio="none">
            <polyline
              fill="none"
              stroke={STATE_COLORS.excited}
              strokeWidth="1.5"
              points={history.map((snap, i) => `${i},${100 - (snap.globalStats.excited ?? 0)}`).join(' ')}
            />
          </svg>
        </div>
      )}
    </div>
  )
}
