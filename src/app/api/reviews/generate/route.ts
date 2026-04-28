import { NextResponse, type NextRequest } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'
import { PLANS, type PlanKey } from '@/lib/plans'

type Tone = 'professional' | 'friendly' | 'apologetic'

type GenerateRequestBody = {
  reviewId?: string
  review_id?: string
  reviewText?: string
  review_text?: string
  reviewerName?: string
  reviewer_name?: string
  rating?: number
  platform?: string
  tone?: Tone
}

type ProfileRow = {
  id: string
  plan: string | null
  plan_status: string | null
  responses_used: number | null
  usage_reset_date: string | null
}

type ReviewRow = {
  id: string
  user_id: string
  platform: string | null
  reviewer_name: string | null
  rating: number | null
  review_text: string | null
  ai_response: string | null
  response_status: string | null
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const VALID_TONES: Tone[] = ['professional', 'friendly', 'apologetic']

const isTone = (value: unknown): value is Tone => typeof value === 'string' && VALID_TONES.includes(value as Tone)
const isPlanKey = (value: string | null | undefined): value is PlanKey => value === 'starter' || value === 'pro' || value === 'agency'

const getMonthlyLimit = (profile: ProfileRow): number => {
  if (!isPlanKey(profile.plan)) return 3
  return PLANS[profile.plan].limit
}

const shouldResetUsage = (usageResetDate: string | null): boolean => {
  if (!usageResetDate) return true
  return new Date(usageResetDate).getTime() <= Date.now()
}

const getNextUsageResetDate = (): string => {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0)).toISOString()
}

const buildSystemPrompt = () =>
  [
    'You are ReplyIQ, an expert AI assistant that writes polished public review responses for local service businesses.',
    'Write responses that sound human, specific, calm, and professional.',
    'Avoid sounding robotic, overly long, defensive, or generic.',
    'Do not mention that you are an AI.',
    'Do not invent facts that are not present in the review.',
    'Keep responses concise: usually 2 to 5 sentences.',
  ].join(' ')

const buildUserPrompt = ({
  reviewText,
  reviewerName,
  rating,
  platform,
  tone,
}: {
  reviewText: string
  reviewerName?: string | null
  rating?: number | null
  platform?: string | null
  tone: Tone
}) => {
  const toneInstruction =
    tone === 'professional'
      ? 'Use a polished, professional tone.'
      : tone === 'friendly'
        ? 'Use a warm, friendly, approachable tone.'
        : 'Use an empathetic, accountable, apologetic tone without over-admitting fault.'

  return `
Write a personalized public response to this customer review.

Tone: ${tone}
Tone instruction: ${toneInstruction}
Platform: ${platform || 'Google/Yelp'}
Reviewer name: ${reviewerName || 'Customer'}
Rating: ${typeof rating === 'number' ? `${rating}/5` : 'Not provided'}

Review:
${reviewText}

Requirements:
- Address the reviewer naturally.
- Reference the review content specifically.
- If the review is positive, thank them and reinforce the business value.
- If the review is negative, acknowledge the issue calmly and invite them to continue the conversation offline.
- Do not include placeholders like [Business Name].
- Return only the response text.
`.trim()
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as GenerateRequestBody | null
    if (!body) return NextResponse.json({ error: 'Missing request body.' }, { status: 400 })

    const tone: Tone = isTone(body.tone) ? body.tone : 'professional'
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) return NextResponse.json({ error: 'You must be logged in to generate responses.' }, { status: 401 })

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, plan, plan_status, responses_used, usage_reset_date')
      .eq('id', user.id)
      .single()

    if (profileError || !profileData) {
      console.error('[reviews-generate] Failed to load profile:', profileError)
      return NextResponse.json({ error: 'Could not load your profile.' }, { status: 500 })
    }

    const profile = profileData as ProfileRow
    const needsUsageReset = shouldResetUsage(profile.usage_reset_date)
    const currentUsage = needsUsageReset ? 0 : profile.responses_used || 0
    const monthlyLimit = getMonthlyLimit(profile)

    if (monthlyLimit !== -1 && currentUsage >= monthlyLimit) {
      return NextResponse.json(
        { error: 'You have reached your monthly response limit. Upgrade your plan to generate more responses.', upgrade: true },
        { status: 402 }
      )
    }

    let review: ReviewRow | null = null
    const reviewId = body.reviewId || body.review_id

    if (reviewId) {
      const { data, error } = await supabase
        .from('reviews')
        .select('id, user_id, platform, reviewer_name, rating, review_text, ai_response, response_status')
        .eq('id', reviewId)
        .eq('user_id', user.id)
        .single()

      if (error || !data) {
        console.error('[reviews-generate] Failed to load review:', { reviewId, userId: user.id, error })
        return NextResponse.json({ error: 'Could not find this review.' }, { status: 404 })
      }

      review = data as ReviewRow
    }

    const reviewText = review?.review_text || body.reviewText?.trim() || body.review_text?.trim()
    if (!reviewText) return NextResponse.json({ error: 'Review text is required.' }, { status: 400 })

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.7,
      max_tokens: 350,
      messages: [
        { role: 'system', content: buildSystemPrompt() },
        {
          role: 'user',
          content: buildUserPrompt({
            reviewText,
            reviewerName: review?.reviewer_name || body.reviewerName || body.reviewer_name,
            rating: review?.rating || body.rating,
            platform: review?.platform || body.platform,
            tone,
          }),
        },
      ],
    })

    const aiResponse = completion.choices[0]?.message?.content?.trim()
    if (!aiResponse) return NextResponse.json({ error: 'AI response generation failed. Please try again.' }, { status: 500 })

    let updatedReview: unknown = null
    if (review?.id) {
      const { data, error: updateReviewError } = await supabase
        .from('reviews')
        .update({ ai_response: aiResponse, response_status: 'generated' })
        .eq('id', review.id)
        .eq('user_id', user.id)
        .select('*')
        .single()

      if (updateReviewError) {
        console.error('[reviews-generate] Failed to update existing review:', updateReviewError)
        return NextResponse.json({ error: 'Generated response, but could not save it to the review.' }, { status: 500 })
      }
      updatedReview = data
    }

    const { error: updateUsageError } = await supabase
      .from('profiles')
      .update({ responses_used: currentUsage + 1, usage_reset_date: needsUsageReset ? getNextUsageResetDate() : profile.usage_reset_date })
      .eq('id', user.id)

    if (updateUsageError) console.error('[reviews-generate] Failed to update usage:', updateUsageError)

    return NextResponse.json({ response: aiResponse, aiResponse, review: updatedReview, reviewId: review?.id || null, responsesUsed: currentUsage + 1 })
  } catch (error) {
    console.error('[reviews-generate] Unexpected error:', error)
    return NextResponse.json({ error: 'Something went wrong while generating the response.' }, { status: 500 })
  }
}
