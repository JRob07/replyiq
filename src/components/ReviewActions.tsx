'use client'

import { useState } from 'react'

type Tone = 'professional' | 'friendly' | 'apologetic'

type ReviewActionsProps = {
  reviewId: string
  hasResponse?: boolean
  onChanged?: () => void | Promise<void>
}

const toneOptions: Array<{
  value: Tone
  label: string
}> = [
  {
    value: 'professional',
    label: 'Professional',
  },
  {
    value: 'friendly',
    label: 'Friendly',
  },
  {
    value: 'apologetic',
    label: 'Apologetic',
  },
]

export default function ReviewActions({
  reviewId,
  hasResponse = false,
  onChanged,
}: ReviewActionsProps) {
  const [selectedTone, setSelectedTone] = useState<Tone>('professional')
  const [isDeleting, setIsDeleting] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const refreshData = async () => {
    if (onChanged) {
      await onChanged()
    }
  }

  const handleDelete = async () => {
    const confirmed = window.confirm(
      'Delete this review? This action cannot be undone.'
    )

    if (!confirmed) {
      return
    }

    setErrorMessage(null)
    setIsDeleting(true)

    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE',
      })

      const data = (await response.json().catch(() => null)) as {
        error?: string
      } | null

      if (!response.ok) {
        throw new Error(data?.error || 'Could not delete this review.')
      }

      await refreshData()
    } catch (error) {
      console.error('[ReviewActions] Delete failed:', error)

      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Could not delete this review. Please try again.'
      )
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reviewId,
          tone: selectedTone,
        }),
      })

      const data = (await response.json().catch(() => null)) as {
        error?: string
      } | null

      if (!response.ok) {
        throw new Error(data?.error || 'Could not generate this response.')
      }

      await refreshData()
    } catch (error) {
      console.error('[ReviewActions] Generate/regenerate failed:', error)

      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Could not generate this response. Please try again.'
      )
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
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none"
          >
            {toneOptions.map((tone) => (
              <option key={tone.value} value={tone.value}>
                {tone.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleRegenerate}
            disabled={isRegenerating || isDeleting}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-lg transition-colors text-sm"
          >
            {isRegenerating
              ? hasResponse
                ? 'Regenerating...'
                : 'Generating...'
              : hasResponse
                ? 'Regenerate Response'
                : '✨ Generate Response'}
          </button>
        </div>

        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting || isRegenerating}
          className="border border-red-700 bg-red-950 hover:bg-red-900 disabled:opacity-50 text-red-300 font-semibold px-5 py-2 rounded-lg transition-colors text-sm"
        >
          {isDeleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>

      {errorMessage ? (
        <div className="rounded-lg border border-red-700 bg-red-950 px-4 py-3 text-sm text-red-400">
          {errorMessage}
        </div>
      ) : null}
    </div>
  )
}