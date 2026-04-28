import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  type GoogleConnection,
  listGoogleAccounts,
  listGoogleLocationsForAccount,
  listGoogleReviewsForLocation,
  refreshGoogleAccessToken,
  starRatingToNumber,
} from '@/lib/google-business'
import { sendNewReviewEmail } from '@/lib/email'

type StoredLocation = {
  id: string
  google_account_name: string
  google_location_name: string
  title: string | null
}

export async function POST() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: connectionData, error: connectionError } = await supabase
      .from('google_connections')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (connectionError || !connectionData) return NextResponse.json({ error: 'Connect Google Business Profile first.' }, { status: 400 })

    const connection = connectionData as GoogleConnection
    const accessToken = await refreshGoogleAccessToken(connection)

    let { data: storedLocations, error: locationsError } = await supabase
      .from('google_locations')
      .select('id, google_account_name, google_location_name, title')
      .eq('user_id', user.id)

    if (locationsError) throw locationsError

    if (!storedLocations || storedLocations.length === 0) {
      const accounts = await listGoogleAccounts(accessToken)
      const createdLocations: StoredLocation[] = []

      for (const account of accounts) {
        const locations = await listGoogleLocationsForAccount(account.name, accessToken)
        for (const location of locations) {
          const { data, error } = await supabase
            .from('google_locations')
            .upsert(
              {
                user_id: user.id,
                connection_id: connection.id,
                google_account_name: account.name,
                google_location_name: location.name,
                title: location.title || null,
                store_code: location.storeCode || null,
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'user_id,google_location_name' }
            )
            .select('id, google_account_name, google_location_name, title')
            .single()

          if (error) throw error
          createdLocations.push(data as StoredLocation)
        }
      }

      storedLocations = createdLocations
    }

    let imported = 0

    for (const location of storedLocations as StoredLocation[]) {
      const reviewsParent = location.google_location_name.startsWith('accounts/')
        ? location.google_location_name
        : `${location.google_account_name}/${location.google_location_name}`
      const reviews = await listGoogleReviewsForLocation(reviewsParent, accessToken)

      for (const review of reviews) {
        const reviewText = review.comment?.trim()
        if (!review.name || !reviewText) continue

        const rating = starRatingToNumber(review.starRating)
        const reviewerName = review.reviewer?.displayName || 'Google reviewer'
        const reviewDate = (review.createTime || review.updateTime || new Date().toISOString()).slice(0, 10)

        const { data: existing } = await supabase
          .from('reviews')
          .select('id')
          .eq('user_id', user.id)
          .eq('platform', 'google')
          .eq('external_review_id', review.name)
          .maybeSingle()

        if (existing) continue

        const { error: insertError } = await supabase.from('reviews').insert({
          user_id: user.id,
          platform: 'google',
          reviewer_name: reviewerName,
          rating,
          review_text: reviewText,
          review_date: reviewDate,
          response_status: 'pending',
          external_review_id: review.name,
          external_location_id: location.google_location_name,
        })

        if (insertError) throw insertError
        imported += 1

        if (user.email) {
          await sendNewReviewEmail({
            to: user.email,
            reviewerName,
            rating,
            platform: 'Google',
            reviewText,
            dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || ''}/dashboard`,
          })
        }
      }

      await supabase
        .from('google_locations')
        .update({ synced_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', location.id)
    }

    return NextResponse.json({ imported })
  } catch (error) {
    console.error('[google-sync] Failed to sync reviews:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not sync Google reviews.' }, { status: 500 })
  }
}
