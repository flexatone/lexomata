'use client'

import { Cell as CellType } from '@/lib/types'
import { STATE_COLORS } from '@/lib/colors'

type Props = {
  cell: CellType
  size: number
}

export default function Cell({ cell, size }: Props) {
  const dotSize = Math.max(3, size * 0.2)

  return (
    <div
      className="relative group"
      style={{
        width: size,
        height: size,
        backgroundColor: STATE_COLORS[cell.state],
      }}
    >
      {/* Proposal dot in top-right corner */}
      <div
        className="absolute top-0.5 right-0.5 rounded-full"
        style={{
          width: dotSize,
          height: dotSize,
          backgroundColor: STATE_COLORS[cell.proposal],
        }}
      />
      {/* Tooltip */}
      <div className="hidden group-hover:block absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 rounded bg-zinc-900 p-2 text-xs text-white shadow-lg pointer-events-none">
        <p><span className="font-medium">State:</span> {cell.state}</p>
        <p><span className="font-medium">Proposal:</span> {cell.proposal}</p>
        <p><span className="font-medium">Reasoning:</span> {cell.reasoning}</p>
      </div>
    </div>
  )
}
