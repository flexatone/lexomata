import { listRecordings } from '@/lib/recordings'
import RecordingList from '@/components/gallery/RecordingList'

export default function GalleryPage() {
  const recordings = listRecordings()

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Gallery</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Recorded simulations from the LLM Game of Life
        </p>
      </div>
      <RecordingList recordings={recordings} />
    </div>
  )
}
