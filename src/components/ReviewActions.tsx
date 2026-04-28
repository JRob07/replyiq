'use client'

import { useState } from 'react'
import { RefreshCw, Trash2 } from 'lucide-react'

type Tone = 'professional' | 'friendly' | 'apologetic'

type ReviewActionsProps = {
  reviewId: string
  hasResponse?: boolean
  onChanged?: () => void | Promise<void>
}

const toneOptions: Array<{ value: Tone; label: string }> = [
  { value: 'professional', label: 'Professional' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'apologetic', label: 'Apologetic' },
]

export default function ReviewActions({ reviewId, hasResponse = false, onChanged }: ReviewActionsProps) {
  const [selectedTone, setSelectedTone] = useState<Tone>('professional')
  const [isDeleting, setIsDeleting] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const refreshData = async () => {
    if (onChanged) await onChanged()
  }

  const handleDelete = async () => {
    const confirmed = window.confirm('Delete this review? This action cannot be undone.')
    if (!confirmed) return

    setErrorMessage(null)
    setIsDeleting(true)

    try {
      const response = await fetch(`/api/reviews/${reviewId}`, { method: 'DELETE' })
      const data = (await response.json().catch(() => null)) as { error?: string } | null
      if (!response.ok) throw new Error(data?.error || 'Could not delete this review.')
      await refreshData()
    } catch (error) {
      console.error('[ReviewActions] Delete failed:', error)
      setErrorMessage(error instanceof Error ? error.message : 'Could not delete this review.')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleRegenerate = async () => {
    setErrorMessage(null)
    setIsRegenerating(true)

    try {
      const response = await fetch('/api/reviews/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId, tone: selectedTone }),
      })

      const data = (await response.json().catch(() => null)) as { error?: string } | null
      if (!response.ok) throw new Error(data?.error || 'Could not generate this response.')
      await refreshData()
    } catch (error) {
      console.error('[ReviewActions] Generate/regenerate failed:', error)
      setErrorMessage(error instanceof Error ? error.message : 'Could not generate this response.')
    } finally {
      setIsRegenerating(false)
    }
  }

  return (
    <div className="mt-5 space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <select
            value={selectedTone}
            onChange={(event) => setSelectedTone(event.target.value as Tone)}
            className="rounded-full border border-zinc-200 bg-white px-4 py-2.5 text-sm font-extrabold text-zinc-800 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
          >
            {toneOptions.map((tone) => (
              <option key={tone.value} value={tone.value}>{tone.label}</option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleRegenerate}
            disabled={isRegenerating || isDeleting}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-zinc-800 disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${isRegenerating ? 'animate-spin' : ''}`} />
            {isRegenerating ? (hasResponse ? 'Regenerating...' : 'Generating...') : hasResponse ? 'Regenerate response' : 'Generate response'}
          </button>
        </div>

        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting || isRegenerating}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-5 py-2.5 text-sm font-extrabold text-rose-700 transition hover:-translate-y-0.5 hover:bg-rose-100 disabled:opacity-60"
        >
          <Trash2 className="h-4 w-4" />
          {isDeleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>

      {errorMessage ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{errorMessage}</div> : null}
    </div>
  )
}
