import fs from 'fs'
import path from 'path'
import { Recording, RecordingMetadata } from './types'

const RECORDINGS_DIR = path.join(process.cwd(), 'recordings')

function ensureDir() {
  if (!fs.existsSync(RECORDINGS_DIR)) {
    fs.mkdirSync(RECORDINGS_DIR, { recursive: true })
  }
}

export function listRecordings(): RecordingMetadata[] {
  ensureDir()
  const files = fs.readdirSync(RECORDINGS_DIR).filter(f => f.endsWith('.json'))
  return files.map(file => {
    const content = JSON.parse(fs.readFileSync(path.join(RECORDINGS_DIR, file), 'utf-8'))
    const id = file.replace('.json', '')
    const { history, ...metadata } = content
    return { id, ...metadata, totalTicks: content.history?.length ?? content.totalTicks ?? 0 }
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export function getRecording(id: string): Recording | null {
  const file = path.join(RECORDINGS_DIR, `${id}.json`)
  if (!fs.existsSync(file)) return null
  const content = JSON.parse(fs.readFileSync(file, 'utf-8'))
  return { id, ...content }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function saveRecording(recording: Omit<Recording, 'id'>): string {
  ensureDir()
  const id = slugify(recording.title) + '-' + Date.now()
  const file = path.join(RECORDINGS_DIR, `${id}.json`)
  const { ...data } = recording
  fs.writeFileSync(file, JSON.stringify(data, null, 2))
  return id
}
