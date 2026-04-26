import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { review_id, tone } = await request.json()

  // Get review
  const { data: review, error: reviewError } = await supabase
    .from('reviews')
    .select('*')
    .eq('id', review_id)
    .eq('user_id', user.id)
    .single()

  if (reviewError || !review) return NextResponse.json({ error: 'Review not found' }, { status: 404 })

  // Get business name
  const { data: profile } = await supabase
    .from('profiles')
    .select('business_name')
    .eq('id', user.id)
    .single()

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

  // Save to DB
  const { data: updated } = await supabase
    .from('reviews')
    .update({ ai_response: aiResponse, response_status: 'generated' })
    .eq('id', review_id)
    .select()
    .single()

  return NextResponse.json({ response: aiResponse, review: updated })
}