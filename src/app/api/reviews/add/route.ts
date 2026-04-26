import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    console.log('USER ID:', user.id)
    console.log('USER META:', user.user_metadata)

    const upsertResult = await supabase.from('profiles').upsert({
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || '',
      business_name: user.user_metadata?.business_name || ''
    }, { onConflict: 'id' })

    console.log('UPSERT RESULT:', JSON.stringify(upsertResult))

    const body = await request.json()
    console.log('BODY:', JSON.stringify(body))

    const { reviewer_name, rating, review_text, review_date, platform } = body

    const insertResult = await supabase.from('reviews').insert({
      user_id: user.id,
      reviewer_name,
      rating,
      review_text,
      review_date,
      platform: platform || 'google'
    }).select().single()

    console.log('INSERT RESULT:', JSON.stringify(insertResult))

    if (insertResult.error) return NextResponse.json({ error: insertResult.error.message }, { status: 500 })
    return NextResponse.json({ review: insertResult.data })

  } catch (err: any) {
    console.error('CAUGHT ERROR:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}