import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { PLANS } from '@/lib/plans'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { review_id, tone } = await request.json()

  // Get profile with usage data
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  // Reset usage if new month
  const now = new Date()
  const resetDate = new Date(profile.usage_reset_date)
  if (now >= resetDate) {
    await supabase.from('profiles').update({
      responses_used: 0,
      usage_reset_date: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString()
    }).eq('id', user.id)
    profile.responses_used = 0
  }

  // Check plan limits
  const plan = profile.plan || 'free'
  const planConfig = PLANS[plan as keyof typeof PLANS]
  
  if (plan === 'free' && profile.responses_used >= 3) {
    return NextResponse.json({ 
      error: 'Free limit reached. Upgrade to continue generating responses.',
      upgrade: true
    }, { status: 403 })
  }

  if (planConfig && planConfig.limit !== -1 && profile.responses_used >= planConfig.limit) {
    return NextResponse.json({ 
      error: `You've used all ${planConfig.limit} responses this month. Upgrade or wait until next month.`,
      upgrade: true
    }, { status: 403 })
  }

  // Get review
  const { data: review, error: reviewError } = await supabase
    .from('reviews')
    .select('*')
    .eq('id', review_id)
    .eq('user_id', user.id)
    .single()

  if (reviewError || !review) return NextResponse.json({ error: 'Review not found' }, { status: 404 })

  const businessName = profile?.business_name || 'our business'
  const toneMap: Record<string, string> = {
    professional: 'professional and courteous',
    friendly: 'warm, friendly and personable',
    apologetic: 'empathetic and apologetic'
  }
  const selectedTone = toneMap[tone] || toneMap.professional

  const prompt = `You are a reputation management assistant for ${businessName}.
Write a ${selectedTone} response to the following ${review.platform} review.
Keep it under 100 words, don't use generic phrases like "we value your feedback", and make it feel human and specific.

Reviewer: ${review.reviewer_name}
Rating: ${review.rating}/5 stars
Review: "${review.review_text}"

Write only the response, nothing else.`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 200
  })

  const aiResponse = completion.choices[0].message.content

  // Save response + increment usage
  const [{ data: updated }] = await Promise.all([
    supabase.from('reviews')
      .update({ ai_response: aiResponse, response_status: 'generated' })
      .eq('id', review_id)
      .select()
      .single(),
    supabase.from('profiles')
      .update({ responses_used: (profile.responses_used || 0) + 1 })
      .eq('id', user.id)
  ])

  return NextResponse.json({ response: aiResponse, review: updated })
}