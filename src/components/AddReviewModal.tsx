'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  onClose: () => void
  onAdded: () => void
}

export default function AddReviewModal({ onClose, onAdded }: Props) {
  const [reviewerName, setReviewerName] = useState('')
  const [rating, setRating] = useState(5)
  const [reviewText, setReviewText] = useState('')
  const [platform, setPlatform] = useState('google')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!reviewerName || !reviewText) { setError('Name and review text are required'); return }
    setLoading(true)
    const res = await fetch('/api/reviews/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reviewer_name: reviewerName,
        rating,
        review_text: reviewText,
        platform,
        review_date: new Date().toISOString().split('T')[0]
      })
    })
    const data = await res.json()
    if (data.error) { setError(data.error); setLoading(false); return }
    onAdded()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 w-full max-w-lg">
        <h2 className="text-white font-bold text-xl mb-6">Add a Review</h2>
        {error && <p className="text-red-400 text-sm mb-4 bg-red-950 p-3 rounded-lg">{error}</p>}
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Platform</label>
            <select
              value={platform}
              onChange={e => setPlatform(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="google">Google</option>
              <option value="yelp">Yelp</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Reviewer Name</label>
            <input
              type="text"
              value={reviewerName}
              onChange={e => setReviewerName(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              placeholder="John Smith"
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Rating</label>
            <div className="flex gap-2">
              {[1,2,3,4,5].map(star => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className={`text-2xl ${star <= rating ? 'text-yellow-400' : 'text-gray-600'}`}
                >★</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Review Text</label>
            <textarea
              value={reviewText}
              onChange={e => setReviewText(e.target.value)}
              rows={4}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
              placeholder="Paste the review here..."
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              {loading ? 'Adding...' : 'Add Review'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}