'use client'

import Link from 'next/link'
import { RecordingMetadata } from '@/lib/types'

type Props = {
  recording: RecordingMetadata
}

export default function RecordingCard({ recording }: Props) {
  const date = new Date(recording.createdAt).toLocaleDateString()

  return (
    <Link
      href={`/recording/${recording.id}`}
      className="block rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
    >
      <h3 className="font-medium text-zinc-900 dark:text-zinc-100">{recording.title}</h3>
      {recording.description && (
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2">{recording.description}</p>
      )}
      <div className="mt-3 flex gap-3 text-xs text-zinc-400 dark:text-zinc-500">
        <span>{recording.config.gridSize}x{recording.config.gridSize}</span>
        <span>{recording.totalTicks} ticks</span>
        <span>{date}</span>
      </div>
    </Link>
  )
}
