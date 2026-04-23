'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { GridSnapshot, SimulationConfig, RunStats } from '@/lib/types'
import Grid from '@/components/grid/Grid'
import SimulationControls from '@/components/workbench/SimulationControls'
import ConfigPanel from '@/components/workbench/ConfigPanel'
import SaveRecordingForm from '@/components/workbench/SaveRecordingForm'
import Stats from '@/components/shared/Stats'

const DEFAULT_CONFIG: SimulationConfig = {
  gridSize: 5,
  llmModel: 'gpt-5.4-nano',
  llmTemperature: 0.7,
  inputCostPerMTok: 0.20,
  outputCostPerMTok: 1.25,
  initialState: 'random',
}

const IS_DEV = process.env.NODE_ENV === 'development'

export default function WorkbenchPage() {
  const [config, setConfig] = useState<SimulationConfig>(DEFAULT_CONFIG)
  const [snapshot, setSnapshot] = useState<GridSnapshot | null>(null)
  const [history, setHistory] = useState<GridSnapshot[]>([])
  const [runStats, setRunStats] = useState<RunStats>({ totalTicks: 0, totalLLMCalls: 0, totalInputTokens: 0, totalOutputTokens: 0, estimatedCost: 0 })
  const [isRunning, setIsRunning] = useState(false)
  const [loading, setLoading] = useState(false)
  const [savedPath, setSavedPath] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const runRef = useRef(false)

  // Initialize grid on mount
  useEffect(() => {
    handleReset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleReset = useCallback(async () => {
    runRef.current = false
    setIsRunning(false)
    setError(null)
    setSavedPath(null)
    try {
      const res = await fetch('/api/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setSnapshot(data.snapshot)
      setHistory([data.snapshot])
      setRunStats({ totalTicks: 0, totalLLMCalls: 0, totalInputTokens: 0, totalOutputTokens: 0, estimatedCost: 0 })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed')
    }
  }, [config])

  const handleStep = useCallback(async () => {
    if (!snapshot || loading) return
    setLoading(true)
    setError(null)
    try {
      const tick = snapshot.tick + 1
      const res = await fetch('/api/tick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentGrid: snapshot.cells, config, tick }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setSnapshot(data.snapshot)
      setHistory(prev => [...prev, data.snapshot])
      const inTok = data.inputTokens ?? 0
      const outTok = data.outputTokens ?? 0
      const tickCost = (inTok * config.inputCostPerMTok + outTok * config.outputCostPerMTok) / 1_000_000
      setRunStats(prev => ({
        totalTicks: prev.totalTicks + 1,
        totalLLMCalls: prev.totalLLMCalls + (data.llmCalls ?? 0),
        totalInputTokens: prev.totalInputTokens + inTok,
        totalOutputTokens: prev.totalOutputTokens + outTok,
        estimatedCost: prev.estimatedCost + tickCost,
      }))
      return data.snapshot
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tick failed')
      return null
    } finally {
      setLoading(false)
    }
  }, [snapshot, loading, config])

  const handleRun = useCallback(async () => {
    runRef.current = true
    setIsRunning(true)

    let current = snapshot
    while (runRef.current && current && current.tick < 999) {
      const tick = current.tick + 1
      try {
        const res = await fetch('/api/tick', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentGrid: current.cells, config, tick }),
        })
        const data = await res.json()
        if (data.error) throw new Error(data.error)
        if (!runRef.current) break
        current = data.snapshot
        setSnapshot(data.snapshot)
        setHistory(prev => [...prev, data.snapshot])
        const inTok = data.inputTokens ?? 0
        const outTok = data.outputTokens ?? 0
        const tickCost = (inTok * config.inputCostPerMTok + outTok * config.outputCostPerMTok) / 1_000_000
        setRunStats(prev => ({
          totalTicks: prev.totalTicks + 1,
          totalLLMCalls: prev.totalLLMCalls + (data.llmCalls ?? 0),
          totalInputTokens: prev.totalInputTokens + inTok,
          totalOutputTokens: prev.totalOutputTokens + outTok,
          estimatedCost: prev.estimatedCost + tickCost,
        }))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Tick failed')
        break
      }
    }

    runRef.current = false
    setIsRunning(false)
  }, [snapshot, config])

  const handlePause = useCallback(() => {
    runRef.current = false
    setIsRunning(false)
  }, [])

  const handleSave = useCallback(async (title: string, description: string) => {
    setSavedPath(null)
    const res = await fetch('/api/recordings/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        description,
        config,
        history,
        totalTicks: runStats.totalTicks,
        totalLLMCalls: runStats.totalLLMCalls,
        estimatedCost: runStats.estimatedCost,
      }),
    })
    const data = await res.json()
    if (data.error) throw new Error(data.error)
    setSavedPath(data.path)
  }, [config, history, runStats])

  const showWarning = history.length >= 500

  return (
    <div>
      {!IS_DEV && (
        <div className="mb-6 rounded bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
          Workbench is designed for local development. Simulation and save are disabled in production.
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Workbench</h1>
      </div>

      {error && (
        <div className="mb-4 rounded bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-800 dark:text-red-200">
          {error}
        </div>
      )}

      {showWarning && (
        <div className="mb-4 rounded bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
          {history.length >= 1000
            ? 'Hard cap reached (1000 ticks). Save or reset.'
            : `${history.length} ticks recorded. Consider saving soon.`}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <SimulationControls
            isRunning={isRunning}
            canStep={!!snapshot && !loading && history.length < 1000}
            tick={snapshot?.tick ?? 0}
            onRun={handleRun}
            onPause={handlePause}
            onStep={handleStep}
            onReset={handleReset}
          />

          {snapshot && <Grid cells={snapshot.cells} />}

          {snapshot && <Stats snapshot={snapshot} runStats={runStats} history={history} />}
        </div>

        <div className="space-y-8">
          <ConfigPanel config={config} onChange={setConfig} disabled={isRunning || loading} />
          {history.length > 0 && (
            <SaveRecordingForm
              onSave={handleSave}
              disabled={isRunning || history.length < 2}
              savedPath={savedPath}
            />
          )}
        </div>
      </div>
    </div>
  )
}
