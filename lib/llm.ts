import OpenAI from 'openai'
import { shunt, SinkFile } from 'shuntly'
import { Cell, SimulationConfig } from './types'
import { getNeighbors, getRegionalStats, getGlobalStats, buildCellPrompt, parseResponse } from './simulation'

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
  prompt: string,
  config: SimulationConfig
): Promise<CellResult> {
  const response = await getClient().chat.completions.create({
    model: config.llmModel,
    temperature: config.llmTemperature,
    messages: [{ role: 'user', content: prompt }],
  })
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
  const promises: Promise<{ row: number; col: number; cell: Cell; inputTokens: number; outputTokens: number }>[] = []

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const cell = grid[row][col]
      const neighbors = getNeighbors(grid, row, col)
      const regionalStats = getRegionalStats(grid, row, col)
      const prompt = buildCellPrompt(cell, neighbors, regionalStats, globalStats)

      promises.push(
        queryCell(prompt, config)
          .then(result => ({
            row,
            col,
            cell: parseResponse(result.content),
            inputTokens: result.inputTokens,
            outputTokens: result.outputTokens,
          }))
          .catch(() => ({
            row,
            col,
            cell: { state: cell.state, proposal: 'calm' as const, reasoning: 'LLM call failed, maintaining state.' },
            inputTokens: 0,
            outputTokens: 0,
          }))
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

  return { grid: newGrid, llmCalls: size * size, inputTokens, outputTokens }
}
