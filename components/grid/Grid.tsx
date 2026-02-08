'use client'

import { Cell as CellType } from '@/lib/types'
import Cell from './Cell'

type Props = {
  cells: CellType[][]
  maxWidth?: number
}

export default function Grid({ cells, maxWidth = 500 }: Props) {
  const gridSize = cells.length
  if (gridSize === 0) return null
  const cellSize = Math.floor(maxWidth / gridSize)

  return (
    <div
      className="inline-grid border border-zinc-300 dark:border-zinc-700"
      style={{
        gridTemplateColumns: `repeat(${gridSize}, ${cellSize}px)`,
        gap: 1,
        backgroundColor: 'rgba(0,0,0,0.1)',
      }}
    >
      {cells.flatMap((row, r) =>
        row.map((cell, c) => (
          <Cell key={`${r}-${c}`} cell={cell} size={cellSize} />
        ))
      )}
    </div>
  )
}
