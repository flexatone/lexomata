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

export async function queryCell(
  prompt: string,
  config: SimulationConfig
): Promise<string> {
  const response = await getClient().chat.completions.create({
    model: config.llmModel,
    temperature: config.llmTemperature,
    messages: [{ role: 'user', content: prompt }],
  })
  return response.choices[0].message.content ?? ''
}

export async function processGrid(
  grid: Cell[][],
  config: SimulationConfig,
): Promise<{ grid: Cell[][], llmCalls: number }> {
  const size = grid.length
  const globalStats = getGlobalStats(grid)
  const promises: Promise<{ row: number; col: number; cell: Cell }>[] = []

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const cell = grid[row][col]
      const neighbors = getNeighbors(grid, row, col)
      const regionalStats = getRegionalStats(grid, row, col)
      const prompt = buildCellPrompt(cell, neighbors, regionalStats, globalStats)

      promises.push(
        queryCell(prompt, config)
          .then(response => ({
            row,
            col,
            cell: parseResponse(response),
          }))
          .catch(() => ({
            // On failure, keep current state, propose calm
            row,
            col,
            cell: { state: cell.state, proposal: 'calm' as const, reasoning: 'LLM call failed, maintaining state.' },
          }))
      )
    }
  }

  const results = await Promise.all(promises)
  const newGrid: Cell[][] = Array.from({ length: size }, () => Array(size))

  for (const { row, col, cell } of results) {
    newGrid[row][col] = cell
  }

  return { grid: newGrid, llmCalls: size * size }
}
