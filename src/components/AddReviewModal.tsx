'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

type Props = {
  onClose: () => void
  onAdded: () => void | Promise<void>
}

export default function AddReviewModal({ onClose, onAdded }: Props) {
  const [reviewerName, setReviewerName] = useState('')
  const [rating, setRating] = useState(5)
  const [reviewText, setReviewText] = useState('')
  const [platform, setPlatform] = useState('google')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!reviewText.trim()) {
      setError('Review text is required.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/reviews/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewer_name: reviewerName.trim() || 'Customer',
          rating,
          review_text: reviewText.trim(),
          platform,
          review_date: new Date().toISOString().split('T')[0],
        }),
      })

      const data = (await res.json().catch(() => null)) as { error?: string } | null

      if (!res.ok) {
        throw new Error(data?.error || 'Could not add this review.')
      }

      await onAdded()
      onClose()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not add this review.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/50 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-2xl shadow-zinc-950/20 sm:p-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.22em] text-zinc-500">New review</p>
            <h2 className="font-display mt-2 text-3xl font-semibold tracking-tight text-zinc-950">Add a customer review</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-zinc-200 p-2 text-zinc-500 transition hover:bg-zinc-50 hover:text-zinc-950"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error ? <p className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</p> : null}

        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-bold text-zinc-700">Platform</label>
            <select
              value={platform}
              onChange={(event) => setPlatform(event.target.value)}
              className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-950 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
            >
              <option value="google">Google</option>
              <option value="yelp">Yelp</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-zinc-700">Reviewer name</label>
            <input
              type="text"
              value={reviewerName}
              onChange={(event) => setReviewerName(event.target.value)}
              className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
              placeholder="John Smith"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-zinc-700">Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`text-3xl transition hover:-translate-y-0.5 ${star <= rating ? 'text-amber-500' : 'text-zinc-200'}`}
                  aria-label={`${star} star rating`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-zinc-700">Review text</label>
            <textarea
              value={reviewText}
              onChange={(event) => setReviewText(event.target.value)}
              rows={5}
              className="w-full resize-none rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium leading-7 text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
              placeholder="Paste the review here..."
            />
          </div>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-full border border-zinc-200 bg-white px-5 py-3 text-sm font-extrabold text-zinc-700 transition hover:-translate-y-0.5 hover:text-zinc-950"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 rounded-full bg-zinc-950 px-5 py-3 text-sm font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-zinc-800 disabled:opacity-60"
            >
              {loading ? 'Adding...' : 'Add review'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
