'use client'

type Props = {
  isPlaying: boolean
  speed: number
  currentTick: number
  totalTicks: number
  onPlay: () => void
  onPause: () => void
  onStepForward: () => void
  onStepBack: () => void
  onJumpToStart: () => void
  onJumpToEnd: () => void
  onSpeedChange: (speed: number) => void
}

const SPEEDS = [0.5, 1, 2, 4]

export default function PlaybackControls({
  isPlaying, speed, currentTick, totalTicks,
  onPlay, onPause, onStepForward, onStepBack,
  onJumpToStart, onJumpToEnd, onSpeedChange,
}: Props) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <button
        onClick={onJumpToStart}
        disabled={currentTick === 0}
        className="rounded border border-zinc-300 dark:border-zinc-600 px-2 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50"
        title="Jump to start"
      >
        &#x23EE;
      </button>
      <button
        onClick={onStepBack}
        disabled={currentTick === 0 || isPlaying}
        className="rounded border border-zinc-300 dark:border-zinc-600 px-2 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50"
        title="Step back"
      >
        &#x23F4;
      </button>
      {isPlaying ? (
        <button
          onClick={onPause}
          className="rounded bg-amber-500 px-3 py-1 font-medium text-white hover:bg-amber-600"
        >
          Pause
        </button>
      ) : (
        <button
          onClick={onPlay}
          disabled={currentTick >= totalTicks - 1}
          className="rounded bg-emerald-600 px-3 py-1 font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          Play
        </button>
      )}
      <button
        onClick={onStepForward}
        disabled={currentTick >= totalTicks - 1 || isPlaying}
        className="rounded border border-zinc-300 dark:border-zinc-600 px-2 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50"
        title="Step forward"
      >
        &#x23F5;
      </button>
      <button
        onClick={onJumpToEnd}
        disabled={currentTick >= totalTicks - 1}
        className="rounded border border-zinc-300 dark:border-zinc-600 px-2 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50"
        title="Jump to end"
      >
        &#x23ED;
      </button>

      {/* Speed selector */}
      <div className="ml-3 flex items-center gap-1">
        {SPEEDS.map(s => (
          <button
            key={s}
            onClick={() => onSpeedChange(s)}
            className={`rounded px-2 py-0.5 ${
              speed === s
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            {s}x
          </button>
        ))}
      </div>

      <span className="ml-3 text-zinc-500 dark:text-zinc-400">
        {currentTick} / {totalTicks - 1}
      </span>
    </div>
  )
}
