import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type RouteContext = {
  params: Promise<{ id: string }>
}

const isValidUuid = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    if (!id || !isValidUuid(id)) return NextResponse.json({ error: 'Invalid review ID.' }, { status: 400 })

    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) return NextResponse.json({ error: 'You must be logged in to delete reviews.' }, { status: 401 })

    const { error } = await supabase.from('reviews').delete().eq('id', id).eq('user_id', user.id)
    if (error) {
      console.error('[reviews-delete] Failed to delete review:', { reviewId: id, userId: user.id, error })
      return NextResponse.json({ error: 'Could not delete this review. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[reviews-delete] Unexpected error:', error)
    return NextResponse.json({ error: 'Something went wrong while deleting this review.' }, { status: 500 })
  }
}
