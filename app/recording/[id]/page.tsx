'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Recording } from '@/lib/types'
import Grid from '@/components/grid/Grid'
import Timeline from '@/components/playback/Timeline'
import PlaybackControls from '@/components/playback/PlaybackControls'
import Stats from '@/components/shared/Stats'

export default function RecordingPage() {
  const params = useParams()
  const id = params.id as string
  const [recording, setRecording] = useState<Recording | null>(null)
  const [currentTick, setCurrentTick] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const playRef = useRef(false)

  useEffect(() => {
    fetch(`/api/recordings/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) setError(data.error)
        else setRecording(data.recording)
      })
      .catch(() => setError('Failed to load recording'))
  }, [id])

  const play = useCallback(async () => {
    if (!recording) return
    playRef.current = true
    setIsPlaying(true)
    let tick = currentTick
    while (playRef.current && tick < recording.history.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500 / speed))
      if (!playRef.current) break
      tick++
      setCurrentTick(tick)
    }
    playRef.current = false
    setIsPlaying(false)
  }, [recording, currentTick, speed])

  const pause = useCallback(() => {
    playRef.current = false
    setIsPlaying(false)
  }, [])

  if (error) {
    return <div className="text-red-600 dark:text-red-400 py-8">{error}</div>
  }

  if (!recording) {
    return <div className="text-zinc-500 dark:text-zinc-400 py-8">Loading...</div>
  }

  const snapshot = recording.history[currentTick]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{recording.title}</h1>
        {recording.description && (
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{recording.description}</p>
        )}
        <div className="mt-2 flex gap-3 text-xs text-zinc-400 dark:text-zinc-500">
          <span>{recording.config.gridSize}x{recording.config.gridSize}</span>
          <span>{recording.totalTicks} ticks</span>
          <span>{recording.totalLLMCalls} LLM calls</span>
          <span>~${recording.estimatedCost.toFixed(4)}</span>
          <span>{recording.config.llmModel}</span>
        </div>
      </div>

      <div className="space-y-6">
        {snapshot && <Grid cells={snapshot.cells} />}

        <Timeline
          history={recording.history}
          currentTick={currentTick}
          onSeek={tick => { pause(); setCurrentTick(tick); }}
        />

        <PlaybackControls
          isPlaying={isPlaying}
          speed={speed}
          currentTick={currentTick}
          totalTicks={recording.history.length}
          onPlay={play}
          onPause={pause}
          onStepForward={() => setCurrentTick(t => Math.min(t + 1, recording.history.length - 1))}
          onStepBack={() => setCurrentTick(t => Math.max(t - 1, 0))}
          onJumpToStart={() => { pause(); setCurrentTick(0); }}
          onJumpToEnd={() => { pause(); setCurrentTick(recording.history.length - 1); }}
          onSpeedChange={setSpeed}
        />

        {snapshot && (
          <Stats
            snapshot={snapshot}
            runStats={{
              totalTicks: recording.totalTicks,
              totalLLMCalls: recording.totalLLMCalls,
              estimatedCost: recording.estimatedCost,
            }}
            history={recording.history}
          />
        )}
      </div>
    </div>
  )
}
