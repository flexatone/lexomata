'use client'

import { RecordingMetadata } from '@/lib/types'
import RecordingCard from './RecordingCard'

type Props = {
  recordings: RecordingMetadata[]
}

export default function RecordingList({ recordings }: Props) {
  if (recordings.length === 0) {
    return (
      <div className="text-center py-16 text-zinc-500 dark:text-zinc-400">
        <p className="text-lg">No recordings yet.</p>
        <p className="mt-1 text-sm">Run a simulation in the workbench and save it.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {recordings.map(recording => (
        <RecordingCard key={recording.id} recording={recording} />
      ))}
    </div>
  )
}
