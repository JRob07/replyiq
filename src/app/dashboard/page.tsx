'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import AddReviewModal from '@/components/AddReviewModal'
import { PLANS } from '@/lib/plans'

interface Review {
  id: string
  reviewer_name: string
  rating: number
  review_text: string
  platform: string
  review_date: string
  ai_response: string | null
  response_status: string
}

interface Profile {
  full_name?: string
  plan?: string
  responses_used?: number
}

export default function DashboardPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [showModal, setShowModal] = useState(false)
  const [generatingId, setGeneratingId] = useState<string | null>(null)
  const [selectedTone, setSelectedTone] = useState<Record<string, string>>({})
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const [{ data: profileData }, { data: reviewData }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('reviews').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    ])
    if (profileData) setProfile(profileData)
    if (reviewData) setReviews(reviewData)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const generateResponse = async (reviewId: string) => {
    setGeneratingId(reviewId)
    setError(null)
    const tone = selectedTone[reviewId] || 'professional'
    const res = await fetch('/api/reviews/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ review_id: reviewId, tone })
    })
    const data = await res.json()
    if (data.error) {
      setError(data.error)
      if (data.upgrade) router.push('/dashboard/billing')
      setGeneratingId(null)
      return
    }
    if (data.review) {
      setReviews(prev => prev.map(r => r.id === reviewId ? data.review : r))
      setProfile(prev => prev ? { ...prev, responses_used: (prev.responses_used || 0) + 1 } : prev)
    }
    setGeneratingId(null)
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const total = reviews.length
  const responded = reviews.filter(r => r.response_status === 'generated').length
  const pending = total - responded

  const plan = profile?.plan || 'free'
  const planConfig = PLANS[plan as keyof typeof PLANS]
  const responsesUsed = profile?.responses_used || 0
  const responseLimit = plan === 'free' ? 3 : planConfig?.limit ?? 3
  const isUnlimited = responseLimit === -1
  const usagePercent = isUnlimited ? 0 : Math.min((responsesUsed / responseLimit) * 100, 100)

  const starColor = (rating: number) => {
    if (rating >= 4) return 'text-yellow-400'
    if (rating === 3) return 'text-orange-400'
    return 'text-red-400'
  }

  return (
    <div>
      {showModal && (
        <AddReviewModal onClose={() => setShowModal(false)} onAdded={fetchData} />
      )}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Welcome back{profile?.full_name ? `, ${profile.full_name}` : ''}
          </h1>
          <p className="text-gray-400 mt-1">Manage and respond to your reviews with AI</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors"
        >
          + Add Review
        </button>
      </div>

      {error && (
        <div className="bg-red-950 border border-red-700 text-red-400 px-4 py-3 rounded-lg mb-6 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300 ml-4">✕</button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Reviews', value: total },
          { label: 'Responded', value: responded },
          { label: 'Pending', value: pending },
        ].map(stat => (
          <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <p className="text-gray-400 text-sm">{stat.label}</p>
            <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
          </div>
        ))}

        {/* Usage card */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-1">
            <p className="text-gray-400 text-sm">Responses Used</p>
            <span className="text-xs text-blue-400 capitalize">{plan}</span>
          </div>
          {isUnlimited ? (
            <p className="text-3xl font-bold text-white mt-1">∞</p>
          ) : (
            <>
              <p className="text-3xl font-bold text-white mt-1">{responsesUsed}<span className="text-gray-500 text-lg">/{responseLimit}</span></p>
              <div className="mt-2 bg-gray-800 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all ${usagePercent >= 80 ? 'bg-red-500' : 'bg-blue-500'}`}
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
            </>
          )}
          {!isUnlimited && responsesUsed >= responseLimit && (
            <button
              onClick={() => router.push('/dashboard/billing')}
              className="mt-2 text-xs text-blue-400 hover:text-blue-300"
            >
              Upgrade →
            </button>
          )}
        </div>
      </div>

      {/* Reviews */}
      {reviews.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
          <p className="text-4xl mb-4">⭐</p>
          <h2 className="text-white font-semibold text-lg mb-2">No reviews yet</h2>
          <p className="text-gray-400 mb-6">Add a review to generate your first AI response</p>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Add Your First Review
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(review => (
            <div key={review.id} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-semibold">{review.reviewer_name}</span>
                    <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full capitalize">{review.platform}</span>
                    {review.response_status === 'generated' && (
                      <span className="text-xs text-green-400 bg-green-950 px-2 py-0.5 rounded-full">Responded</span>
                    )}
                  </div>
                  <div className={`text-lg ${starColor(review.rating)}`}>
                    {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                  </div>
                </div>
                <span className="text-gray-500 text-sm">{review.review_date}</span>
              </div>

              <p className="text-gray-300 mb-4">{review.review_text}</p>

              {review.ai_response ? (
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <p className="text-xs text-blue-400 font-semibold mb-2">AI RESPONSE</p>
                  <p className="text-gray-200 text-sm">{review.ai_response}</p>
                  <button
                    onClick={() => copyToClipboard(review.ai_response!, review.id)}
                    className="mt-3 text-sm bg-gray-700 hover:bg-gray-600 text-white px-4 py-1.5 rounded-lg transition-colors"
                  >
                    {copiedId === review.id ? '✓ Copied!' : 'Copy Response'}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <select
                    value={selectedTone[review.id] || 'professional'}
                    onChange={e => setSelectedTone(prev => ({ ...prev, [review.id]: e.target.value }))}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none"
                  >
                    <option value="professional">Professional</option>
                    <option value="friendly">Friendly</option>
                    <option value="apologetic">Apologetic</option>
                  </select>
                  <button
                    onClick={() => generateResponse(review.id)}
                    disabled={generatingId === review.id}
                    className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-lg transition-colors text-sm"
                  >
                    {generatingId === review.id ? 'Generating...' : '✨ Generate Response'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}