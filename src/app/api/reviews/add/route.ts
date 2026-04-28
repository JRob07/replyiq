import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendNewReviewEmail } from '@/lib/email'

type AddReviewRequestBody = {
  platform?: string
  reviewer_name?: string
  reviewerName?: string
  rating?: number
  review_text?: string
  reviewText?: string
  review_date?: string
  reviewDate?: string
}

const getAppUrl = (request: NextRequest): string => {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (envUrl) return envUrl.replace(/\/$/, '')
  const origin = request.headers.get('origin')
  if (origin) return origin.replace(/\/$/, '')
  return new URL(request.url).origin
}

const normalizeRating = (rating: unknown): number => {
  const parsed = Number(rating)
  if (!Number.isFinite(parsed)) return 5
  return Math.max(1, Math.min(5, Math.round(parsed)))
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as AddReviewRequestBody | null
    if (!body) return NextResponse.json({ error: 'Missing request body.' }, { status: 400 })

    const platform = (body.platform || 'google').trim().toLowerCase()
    const reviewerName = (body.reviewer_name || body.reviewerName || 'Customer').trim()
    const reviewText = (body.review_text || body.reviewText || '').trim()
    const reviewDate = body.review_date || body.reviewDate || new Date().toISOString().slice(0, 10)
    const rating = normalizeRating(body.rating)

    if (!reviewText) return NextResponse.json({ error: 'Review text is required.' }, { status: 400 })

    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) return NextResponse.json({ error: 'You must be logged in to add reviews.' }, { status: 401 })

    await supabase.from('profiles').upsert(
      {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || '',
        business_name: user.user_metadata?.business_name || '',
      },
      { onConflict: 'id' }
    )

    const { data: review, error: insertError } = await supabase
      .from('reviews')
      .insert({
        user_id: user.id,
        platform,
        reviewer_name: reviewerName,
        rating,
        review_text: reviewText,
        review_date: reviewDate,
        response_status: 'pending',
      })
      .select('*')
      .single()

    if (insertError) {
      console.error('[reviews-add] Failed to insert review:', insertError)
      return NextResponse.json({ error: 'Could not add this review. Please try again.' }, { status: 500 })
    }

    if (user.email) {
      await sendNewReviewEmail({
        to: user.email,
        reviewerName,
        rating,
        platform,
        reviewText,
        dashboardUrl: `${getAppUrl(request)}/dashboard`,
      })
    }

    return NextResponse.json({ review })
  } catch (error) {
    console.error('[reviews-add] Unexpected error:', error)
    return NextResponse.json({ error: 'Something went wrong while adding this review.' }, { status: 500 })
  }
}
