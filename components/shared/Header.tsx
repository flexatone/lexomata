'use client'

import Link from 'next/link'

export default function Header() {
  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto max-w-6xl flex items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Lexomata
        </Link>
        <nav className="flex gap-6 text-sm">
          <Link href="/" className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
            Gallery
          </Link>
          <Link href="/workbench" className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
            Workbench
          </Link>
        </nav>
      </div>
    </header>
  )
}
