'use client'

import { useState } from 'react'

type Props = {
  onSave: (title: string, description: string) => Promise<void>
  disabled?: boolean
  savedPath?: string | null
}

export default function SaveRecordingForm({ onSave, disabled, savedPath }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!title.trim()) return
    setSaving(true)
    try {
      await onSave(title, description)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3 text-sm">
      <h3 className="font-medium text-zinc-700 dark:text-zinc-300">Save Recording</h3>
      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={e => setTitle(e.target.value)}
        disabled={disabled || saving}
        className="w-full rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-1.5 disabled:opacity-50"
      />
      <textarea
        placeholder="Description"
        value={description}
        onChange={e => setDescription(e.target.value)}
        disabled={disabled || saving}
        rows={2}
        className="w-full rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-1.5 disabled:opacity-50"
      />
      <button
        onClick={handleSave}
        disabled={disabled || saving || !title.trim()}
        className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {saving ? 'Saving...' : 'Save'}
      </button>
      {savedPath && (
        <p className="text-emerald-600 dark:text-emerald-400">
          Saved to <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">{savedPath}</code>
        </p>
      )}
    </div>
  )
}
