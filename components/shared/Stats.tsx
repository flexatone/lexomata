'use client'

import { CellState, GridSnapshot, RunStats } from '@/lib/types'
import { PALETTE, STATE_COLORS } from '@/lib/colors'

type Props = {
  snapshot: GridSnapshot | null
  runStats?: RunStats
  history?: GridSnapshot[]
}

const STATES: CellState[] = ['dormant', 'calm', 'engaged', 'excited']

export default function Stats({ snapshot, runStats, history }: Props) {
  if (!snapshot) return null

  const { colorDistribution, stateDistribution, compositionClusters, avgPhaseCoherence } = snapshot.globalStats

  return (
    <div className="space-y-4 text-sm">
      {/* Color distribution bar (primary) */}
      <div>
        <p className="mb-1 font-medium text-zinc-700 dark:text-zinc-300">Color Distribution</p>
        <div className="flex h-6 w-full overflow-hidden rounded">
          {[0, 1, 2, 3, 4, 5, 6, 7].map(i => {
            const pct = colorDistribution[i] ?? 0
            if (pct === 0) return null
            return (
              <div
                key={i}
                style={{ width: `${pct}%`, backgroundColor: PALETTE[i] }}
                className="flex items-center justify-center text-[10px] font-medium text-white"
                title={`Color ${i}: ${pct}%`}
              >
                {pct > 8 ? `${pct}%` : ''}
              </div>
            )
          })}
        </div>
        <div className="mt-1 flex gap-3">
          {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
            <span key={i} className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: PALETTE[i] }} />
              <span className="text-zinc-500 dark:text-zinc-400">{colorDistribution[i] ?? 0}%</span>
            </span>
          ))}
        </div>
      </div>

      {/* Composition & coherence info */}
      <div className="flex gap-6 text-zinc-600 dark:text-zinc-400">
        <span>{compositionClusters} composition cluster{compositionClusters !== 1 ? 's' : ''}</span>
        <span>Phase coherence: {(avgPhaseCoherence * 100).toFixed(0)}%</span>
      </div>

      {/* Mood distribution (secondary, smaller) */}
      <div>
        <p className="mb-1 font-medium text-zinc-700 dark:text-zinc-300 text-xs">Mood Distribution</p>
        <div className="flex h-4 w-full overflow-hidden rounded">
          {STATES.map(s => {
            const pct = stateDistribution[s] ?? 0
            if (pct === 0) return null
            return (
              <div
                key={s}
                style={{ width: `${pct}%`, backgroundColor: STATE_COLORS[s] }}
                className="flex items-center justify-center text-[9px] font-medium text-white"
                title={`${s}: ${pct}%`}
              >
                {pct > 10 ? `${pct}%` : ''}
              </div>
            )
          })}
        </div>
        <div className="mt-1 flex gap-3">
          {STATES.map(s => (
            <span key={s} className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: STATE_COLORS[s] }} />
              <span className="text-zinc-500 dark:text-zinc-400 text-xs">{s}: {stateDistribution[s]}%</span>
            </span>
          ))}
        </div>
      </div>

      {/* Run stats */}
      {runStats && (
        <div className="flex flex-wrap gap-4 text-zinc-500 dark:text-zinc-400">
          <span>Tick: {snapshot.tick}</span>
          <span>LLM calls: {runStats.totalLLMCalls}</span>
          <span>Tokens: {(runStats.totalInputTokens + runStats.totalOutputTokens).toLocaleString()} ({runStats.totalInputTokens.toLocaleString()} in / {runStats.totalOutputTokens.toLocaleString()} out)</span>
          <span>~${runStats.estimatedCost.toFixed(4)}</span>
        </div>
      )}

      {/* Phase coherence sparkline */}
      {history && history.length > 1 && (
        <div>
          <p className="mb-1 font-medium text-zinc-700 dark:text-zinc-300">Phase Coherence over time</p>
          <svg viewBox={`0 0 ${history.length} 100`} className="h-12 w-full" preserveAspectRatio="none">
            <polyline
              fill="none"
              stroke="#3b82f6"
              strokeWidth="1.5"
              points={history.map((snap, i) => `${i},${100 - (snap.globalStats.avgPhaseCoherence ?? 0) * 100}`).join(' ')}
            />
          </svg>
        </div>
      )}
    </div>
  )
}
