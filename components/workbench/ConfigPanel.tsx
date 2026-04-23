'use client'

import { SimulationConfig } from '@/lib/types'

type Props = {
  config: SimulationConfig
  onChange: (config: SimulationConfig) => void
  disabled?: boolean
}

const GRID_SIZES = [5, 8, 10, 15, 20]
const INITIAL_STATES: SimulationConfig['initialState'][] = ['random', 'center-excited', 'all-calm']

export default function ConfigPanel({ config, onChange, disabled }: Props) {
  return (
    <div className="space-y-4 text-sm">
      <div>
        <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">Grid Size</label>
        <div className="flex gap-2">
          {GRID_SIZES.map(size => (
            <button
              key={size}
              onClick={() => onChange({ ...config, gridSize: size })}
              disabled={disabled}
              className={`px-3 py-1 rounded border transition-colors ${
                config.gridSize === size
                  ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100'
                  : 'border-zinc-300 dark:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              } disabled:opacity-50`}
            >
              {size}x{size}
            </button>
          ))}
        </div>
        {config.gridSize > 15 && (
          <p className="mt-1 text-amber-600 dark:text-amber-400 text-xs">
            Large grids ({config.gridSize}x{config.gridSize} = {config.gridSize ** 2} LLM calls/tick) will be slow and expensive.
          </p>
        )}
      </div>

      <div>
        <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
          Temperature: {config.llmTemperature.toFixed(1)}
        </label>
        <input
          type="range"
          min="0"
          max="1.5"
          step="0.1"
          value={config.llmTemperature}
          onChange={e => onChange({ ...config, llmTemperature: parseFloat(e.target.value) })}
          disabled={disabled}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-zinc-400">
          <span>0.0</span>
          <span>1.5</span>
        </div>
      </div>

      <div>
        <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">Initial State</label>
        <div className="flex gap-2 flex-wrap">
          {INITIAL_STATES.map(state => (
            <button
              key={state}
              onClick={() => onChange({ ...config, initialState: state })}
              disabled={disabled}
              className={`px-3 py-1 rounded border transition-colors ${
                config.initialState === state
                  ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100'
                  : 'border-zinc-300 dark:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              } disabled:opacity-50`}
            >
              {state}
            </button>
          ))}
        </div>
      </div>

    </div>
  )
}
