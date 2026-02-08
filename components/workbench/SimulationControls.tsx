'use client'

type Props = {
  isRunning: boolean
  canStep: boolean
  tick: number
  onRun: () => void
  onPause: () => void
  onStep: () => void
  onReset: () => void
}

export default function SimulationControls({ isRunning, canStep, tick, onRun, onPause, onStep, onReset }: Props) {
  return (
    <div className="flex items-center gap-3">
      {isRunning ? (
        <button
          onClick={onPause}
          className="rounded bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 transition-colors"
        >
          Pause
        </button>
      ) : (
        <button
          onClick={onRun}
          disabled={!canStep}
          className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
        >
          Run
        </button>
      )}
      <button
        onClick={onStep}
        disabled={!canStep || isRunning}
        className="rounded border border-zinc-300 dark:border-zinc-600 px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 transition-colors"
      >
        Step
      </button>
      <button
        onClick={onReset}
        className="rounded border border-zinc-300 dark:border-zinc-600 px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
      >
        Reset
      </button>
      <span className="text-sm text-zinc-500 dark:text-zinc-400 ml-2">
        Tick: {tick}
      </span>
    </div>
  )
}
