import OpenAI from 'openai'
import { shunt, SinkFile } from 'shuntly'
import { Cell, SimulationConfig } from './types'
import { getNeighbors, getRegionalStats, getGlobalStats, buildSystemPrompt, buildCellPrompt, parseResponse, computeMoods } from './simulation'

let _client: ReturnType<typeof shunt<OpenAI>> | null = null

function getClient() {
  if (!_client) {
    const sink = process.env.NODE_ENV === 'development'
      ? new SinkFile('/tmp/llm-gol-shuntly.jsonl')
      : undefined
    _client = shunt(
      new OpenAI({ apiKey: process.env.OPENAI_API_KEY }),
      sink
    )
  }
  return _client
}

export type CellResult = {
  content: string
  inputTokens: number
  outputTokens: number
}

export async function queryCell(
  systemPrompt: string,
  userPrompt: string,
  config: SimulationConfig,
  signal?: AbortSignal
): Promise<CellResult> {
  const response = await getClient().chat.completions.create({
    model: config.llmModel,
    temperature: config.llmTemperature,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  }, { signal })
  return {
    content: response.choices[0].message.content ?? '',
    inputTokens: response.usage?.prompt_tokens ?? 0,
    outputTokens: response.usage?.completion_tokens ?? 0,
  }
}

export type GridResult = {
  grid: Cell[][]
  llmCalls: number
  inputTokens: number
  outputTokens: number
}

export async function processGrid(
  grid: Cell[][],
  config: SimulationConfig,
): Promise<GridResult> {
  const size = grid.length
  const globalStats = getGlobalStats(grid)
  const systemPrompt = buildSystemPrompt()
  const abort = new AbortController()

  const promises: Promise<{ row: number; col: number; cell: Cell; inputTokens: number; outputTokens: number }>[] = []

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const cell = grid[row][col]
      const neighbors = getNeighbors(grid, row, col)
      const regionalStats = getRegionalStats(grid, row, col)
      const userPrompt = buildCellPrompt(cell, neighbors, regionalStats, globalStats)

      promises.push(
        queryCell(systemPrompt, userPrompt, config, abort.signal)
          .then(result => ({
            row,
            col,
            cell: parseResponse(result.content, cell),
            inputTokens: result.inputTokens,
            outputTokens: result.outputTokens,
          }))
          .catch(err => {
            abort.abort()
            throw err
          })
      )
    }
  }

  const results = await Promise.all(promises)
  const newGrid: Cell[][] = Array.from({ length: size }, () => Array(size))
  let inputTokens = 0
  let outputTokens = 0

  for (const r of results) {
    newGrid[r.row][r.col] = r.cell
    inputTokens += r.inputTokens
    outputTokens += r.outputTokens
  }

  return { grid: computeMoods(newGrid), llmCalls: size * size, inputTokens, outputTokens }
}
