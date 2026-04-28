import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  type GoogleConnection,
  listGoogleAccounts,
  listGoogleLocationsForAccount,
  refreshGoogleAccessToken,
} from '@/lib/google-business'

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
    const accounts = await listGoogleAccounts(accessToken)
    const savedLocations = []

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
          .select('*')
          .single()

        if (error) throw error
        savedLocations.push(data)
      }
    }

    return NextResponse.json({ locations: savedLocations })
  } catch (error) {
    console.error('[google-locations] Failed to list locations:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not list Google locations.' }, { status: 500 })
  }
}
