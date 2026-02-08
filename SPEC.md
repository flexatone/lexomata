# LLM Game of Life — Specification

## Overview

A Next.js application that simulates a cellular automaton where each cell is an LLM agent. Cells have states, perceive their neighbors, and make proposals about what their neighbors should become. The goal is to observe emergent social dynamics as cells pursue excitement while maintaining autonomy.

Two modes:
- **Workbench**: local dev only, run simulations, save histories to local files
- **Gallery**: public deployment, auto-discovers committed recordings

## Core Concepts

### Cell State

Each cell has:
- **state**: one of `dormant`, `calm`, `engaged`, `excited`
- **proposal**: what state it wants its neighbors to adopt (same vocabulary)
- **reasoning**: one sentence explaining its decision

### Grid

- Square grid of NxN cells
- Toroidal topology (edges wrap)
- Synchronous updates each tick

### Perception

Each cell receives:
1. Its own current state
2. Its 8 immediate neighbors' states and proposals (directional)
3. Regional summary: state distribution in 5x5 area centered on cell
4. Global summary: state distribution across entire grid

### Agency

Each cell:
- Wants to experience excitement
- Values autonomy (resists pressure)

## Technical Architecture

### Stack

- Next.js 14+ with App Router
- TypeScript
- Tailwind CSS
- File-based recording storage
- shuntly for LLM call inspection
- Deployed on AWS Amplify

### Project Structure

```
/app
  /page.tsx                      gallery home
  /recording/[id]/page.tsx       playback single recording
  /workbench/page.tsx            local simulation workspace
  /api
    /tick/route.ts               POST: advance one tick
    /reset/route.ts              POST: reset grid
    /recordings/route.ts         GET: list recordings
    /recordings/[id]/route.ts    GET: single recording
    /recordings/save/route.ts    POST: save to file (dev only)
/components
  /grid
    Grid.tsx
    Cell.tsx
  /playback
    Timeline.tsx
    PlaybackControls.tsx
  /workbench
    SimulationControls.tsx
    ConfigPanel.tsx
    SaveRecordingForm.tsx
  /gallery
    RecordingCard.tsx
    RecordingList.tsx
  /shared
    Stats.tsx
    Header.tsx
/lib
  types.ts
  simulation.ts
  llm.ts                         uses shuntly for LLM call inspection
  colors.ts
  recordings.ts                  file discovery and parsing
/recordings                      committed JSON files
  /example-waves.json
  /center-burst.json
  /...
```

### Types (`/lib/types.ts`)

```typescript
export type CellState = 'dormant' | 'calm' | 'engaged' | 'excited'

export type Cell = {
  state: CellState
  proposal: CellState
  reasoning: string
}

export type GridSnapshot = {
  tick: number
  cells: Cell[][]
  globalStats: Record<CellState, number>
}

export type SimulationConfig = {
  gridSize: number
  llmModel: string  // default to gpt-5-nano
  llmTemperature: number
  initialState: 'random' | 'center-excited' | 'all-calm' | 'custom'
  customInitialGrid?: CellState[][]
}

export type Recording = {
  id: string                     // derived from filename
  title: string
  description: string
  config: SimulationConfig
  history: GridSnapshot[]
  totalTicks: number
  totalLLMCalls: number
  estimatedCost: number
  createdAt: string              // ISO date
}

export type RecordingMetadata = Omit<Recording, 'history'>

export type RunStats = {
  totalTicks: number
  totalLLMCalls: number
  estimatedCost: number
}

export type Direction = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW'

export type NeighborInfo = {
  direction: Direction
  state: CellState
  proposal: CellState
}
```

### Recording File Format

Each recording is a single JSON file in `/recordings`:

```json
{
  "title": "Center Burst",
  "description": "Single excited cell in center, all others calm",
  "config": {
    "gridSize": 10,
    "llmModel": "gpt-5-nano",
    "llmTemperature": 0.7,
    "initialState": "center-excited"
  },
  "history": [ ... ],
  "totalTicks": 50,
  "totalLLMCalls": 5000,
  "estimatedCost": 0.25,
  "createdAt": "2025-02-07T10:30:00Z"
}
```

Filename becomes the `id`. Example: `center-burst.json` → id is `center-burst`.

### Recording Discovery (`/lib/recordings.ts`)

```typescript
import fs from 'fs'
import path from 'path'

const RECORDINGS_DIR = path.join(process.cwd(), 'recordings')

export function listRecordings(): RecordingMetadata[] {
  const files = fs.readdirSync(RECORDINGS_DIR).filter(f => f.endsWith('.json'))
  return files.map(file => {
    const content = JSON.parse(fs.readFileSync(path.join(RECORDINGS_DIR, file), 'utf-8'))
    const id = file.replace('.json', '')
    const { history, ...metadata } = content
    return { id, ...metadata }
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export function getRecording(id: string): Recording | null {
  const file = path.join(RECORDINGS_DIR, `${id}.json`)
  if (!fs.existsSync(file)) return null
  const content = JSON.parse(fs.readFileSync(file, 'utf-8'))
  return { id, ...content }
}

export function saveRecording(recording: Omit<Recording, 'id'>): string {
  const id = slugify(recording.title) + '-' + Date.now()
  const file = path.join(RECORDINGS_DIR, `${id}.json`)
  fs.writeFileSync(file, JSON.stringify(recording, null, 2))
  return id
}
```

### Simulation Logic (`/lib/simulation.ts`)

```typescript
function getNeighbors(grid: Cell[][], row: number, col: number): NeighborInfo[]

function getRegionalStats(grid: Cell[][], row: number, col: number): Record<CellState, number>

function getGlobalStats(grid: Cell[][]): Record<CellState, number>

function buildCellPrompt(
  cell: Cell,
  neighbors: NeighborInfo[],
  regionalStats: Record<CellState, number>,
  globalStats: Record<CellState, number>
): string

function parseResponse(response: string): Cell

function initializeGrid(config: SimulationConfig): Cell[][]
```

### Prompt Template

```
You are a cell in a grid. You want to experience excitement, but you also value your autonomy.

Your current state: {state}

Your immediate neighbors:
- N: {state}, proposes you become {proposal}
- NE: {state}, proposes you become {proposal}
- E: {state}, proposes you become {proposal}
- SE: {state}, proposes you become {proposal}
- S: {state}, proposes you become {proposal}
- SW: {state}, proposes you become {proposal}
- W: {state}, proposes you become {proposal}
- NW: {state}, proposes you become {proposal}

Your region (5x5): {n}% dormant, {n}% calm, {n}% engaged, {n}% excited
The whole grid: {n}% dormant, {n}% calm, {n}% engaged, {n}% excited

Valid states: dormant, calm, engaged, excited

Respond in exactly this format with no other text:
STATE: {your next state}
PROPOSAL: {what you want your neighbors to become}
REASONING: {one sentence why}
```

### LLM Integration with shuntly (`/lib/llm.ts`)

Use shuntly to wrap the OpenAI client. This captures all requests and responses as JSON for inspection. In development, output goes to stderr by default, viewable with a JSON viewer like `fx`.

```typescript
import OpenAI from 'openai'
import { shunt, SinkFile } from 'shuntly'

// In development, also write to a file for easier inspection
const sink = process.env.NODE_ENV === 'development'
  ? new SinkFile('/tmp/llm-gol-shuntly.jsonl')
  : undefined

const openaiClient = shunt(
  new OpenAI({ apiKey: process.env.OPENAI_API_KEY }),
  sink
)

export async function queryCell(
  prompt: string,
  config: SimulationConfig
): Promise<string> {
  const response = await openaiClient.chat.completions.create({
    model: config.llmModel,
    temperature: config.llmTemperature,
    messages: [{ role: 'user', content: prompt }],
  })
  return response.choices[0].message.content ?? ''
}

export async function processGrid(
  grid: Cell[][],
  config: SimulationConfig,
  tick: number
): Promise<{ grid: Cell[][], tokenUsage: number }> {
  const size = grid.length
  const promises: Promise<{ row: number, col: number, cell: Cell }>[] = []

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const cell = grid[row][col]
      const neighbors = getNeighbors(grid, row, col)
      const regionalStats = getRegionalStats(grid, row, col)
      const globalStats = getGlobalStats(grid)
      const prompt = buildCellPrompt(cell, neighbors, regionalStats, globalStats)

      promises.push(
        queryCell(prompt, config)
          .then(response => ({
            row,
            col,
            cell: parseResponse(response)
          }))
      )
    }
  }

  const results = await Promise.all(promises)
  const newGrid: Cell[][] = Array(size).fill(null).map(() => Array(size))
  let tokenUsage = 0  // TODO: track from responses if needed

  for (const { row, col, cell } of results) {
    newGrid[row][col] = cell
  }

  return { grid: newGrid, tokenUsage }
}
```

### Viewing shuntly output

During development, view LLM calls in real-time:

```bash
# If using SinkFile (writes to /tmp/llm-gol-shuntly.jsonl)
tail -f /tmp/llm-gol-shuntly.jsonl | fx

# Or if using default stderr output
npm run dev 2>&1 >/dev/null | fx
```

Each LLM call produces a JSON record with request, response, duration, and any errors.

### API Routes

**POST `/api/tick`**

Request:
```typescript
{ currentGrid: Cell[][], config: SimulationConfig, tick: number }
```

Response:
```typescript
{ snapshot: GridSnapshot, tokenUsage: number }
```

**POST `/api/reset`**

Request:
```typescript
{ config: SimulationConfig }
```

Response:
```typescript
{ snapshot: GridSnapshot }
```

**GET `/api/recordings`**

Response:
```typescript
{ recordings: RecordingMetadata[] }
```

**GET `/api/recordings/[id]`**

Response:
```typescript
{ recording: Recording }
```

**POST `/api/recordings/save`**

Only functional in dev (`process.env.NODE_ENV === 'development'`). Returns 403 in production.

Request:
```typescript
{
  title: string
  description: string
  config: SimulationConfig
  history: GridSnapshot[]
  totalTicks: number
  totalLLMCalls: number
  estimatedCost: number
}
```

Response:
```typescript
{ id: string, path: string }
```

### Pages

**Gallery (`/page.tsx`)**
- Lists all recordings from `/recordings` directory
- Grid of `RecordingCard` components
- Click to view

**Recording View (`/recording/[id]/page.tsx`)**
- Full playback interface
- Grid, Timeline, Stats
- Read-only

**Workbench (`/workbench/page.tsx`)**
- Only usable in local dev (show warning banner in production)
- Full simulation controls
- Config panel
- Save form (title, description)
- Saves to `/recordings` directory

### UI Components

**Grid.tsx**
- NxN colored cells
- Colors: dormant (slate-400), calm (blue-400), engaged (amber-400), excited (rose-500)
- Scales cell size to grid size
- Hover tooltip: state, proposal, reasoning

**Cell.tsx**
- Colored square
- Small dot in corner showing proposal color

**Timeline.tsx**
- Horizontal scrubber
- Click to seek
- Sparkline of excitement over time

**PlaybackControls.tsx**
- Play/Pause
- Step forward/back
- Speed: 0.5x, 1x, 2x, 4x
- Jump to start/end

**SimulationControls.tsx**
- Run/Pause
- Step
- Reset

**ConfigPanel.tsx**
- Grid size: 5, 8, 10, 15, 20
- Temperature: 0.0 to 1.5
- Initial state: random, center-excited, all-calm

**SaveRecordingForm.tsx**
- Title input
- Description textarea
- Save button
- Shows saved file path on success

**RecordingCard.tsx**
- Title
- Grid size, tick count, date
- Thumbnail: small static grid of final state

**Stats.tsx**
- State distribution bar
- Totals: ticks, calls, cost
- Excitement over time chart

### Workflow

1. Run `npm run dev`
2. Open `/workbench`
3. Optionally, in another terminal: `tail -f /tmp/llm-gol-shuntly.jsonl | fx` to watch LLM calls
4. Configure and run simulation
5. Inspect prompts/responses in shuntly output as cells update
6. When interesting, fill in title/description, click Save
7. Recording written to `/recordings/{slug}-{timestamp}.json`
8. Review file, rename if desired
9. `git add recordings/my-recording.json`
10. Commit and push
11. Deploy picks up new file, visible in gallery

### Environment Variables




```
OPENAI_API_KEY=...
```

### Dependencies

```json
{
  "dependencies": {
    "next": "^14",
    "react": "^18",
    "react-dom": "^18",
    "openai": "^4",
    "shuntly": "^0.5"
  },
  "devDependencies": {
    "typescript": "^5",
    "@types/node": "^20",
    "@types/react": "^18",
    "tailwindcss": "^3"
  }
}
```

### Edge Cases

- Parse failures: retry once, default to keeping state, proposing `calm`
- Rate limits: backoff, surface error
- Large grids: warn if > 15x15
- History cap: warn at 500 ticks, hard stop at 1000
- Production workbench: show read-only warning, disable save

## Implementation Priority

1. Types
2. Simulation logic
3. LLM integration with shuntly
4. API routes: tick, reset
5. Workbench: Grid, SimulationControls, ConfigPanel
6. Playback: Timeline, PlaybackControls
7. Save: SaveRecordingForm, save API route
8. Recording discovery
9. Gallery page
10. Recording view page
11. Stats
12. Polish
