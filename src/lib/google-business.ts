import 'server-only'

import { supabaseAdmin } from '@/lib/supabase/admin'

export type GoogleConnection = {
  id: string
  user_id: string
  access_token: string | null
  refresh_token: string | null
  expires_at: string | null
}

export type GoogleAccount = {
  name: string
  accountName?: string
  type?: string
}

export type GoogleLocation = {
  name: string
  title?: string
  storeCode?: string
}

export type GoogleReview = {
  name: string
  reviewId?: string
  reviewer?: {
    displayName?: string
  }
  starRating?: string
  comment?: string
  createTime?: string
  updateTime?: string
}

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const ACCOUNT_MANAGEMENT_URL = 'https://mybusinessaccountmanagement.googleapis.com/v1/accounts'

const requireEnv = (name: string) => {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name} environment variable.`)
  return value
}

export const getGoogleRedirectUri = () => {
  const appUrl = requireEnv('NEXT_PUBLIC_APP_URL').replace(/\/$/, '')
  return `${appUrl}/api/integrations/google/callback`
}

export const buildGoogleAuthUrl = (state: string) => {
  const params = new URLSearchParams({
    client_id: requireEnv('GOOGLE_CLIENT_ID'),
    redirect_uri: getGoogleRedirectUri(),
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/business.manage',
    access_type: 'offline',
    prompt: 'consent',
    state,
  })

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

export const exchangeCodeForTokens = async (code: string) => {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: requireEnv('GOOGLE_CLIENT_ID'),
      client_secret: requireEnv('GOOGLE_CLIENT_SECRET'),
      redirect_uri: getGoogleRedirectUri(),
      grant_type: 'authorization_code',
    }),
  })

  const data = (await response.json()) as {
    access_token?: string
    refresh_token?: string
    expires_in?: number
    error?: string
    error_description?: string
  }

  if (!response.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || 'Google token exchange failed.')
  }

  return data
}

export const refreshGoogleAccessToken = async (connection: GoogleConnection) => {
  if (!connection.refresh_token) throw new Error('Google connection is missing a refresh token. Reconnect Google Business Profile.')

  const expiresAt = connection.expires_at ? new Date(connection.expires_at).getTime() : 0
  const shouldRefresh = !connection.access_token || expiresAt - Date.now() < 60_000
  if (!shouldRefresh && connection.access_token) return connection.access_token

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: requireEnv('GOOGLE_CLIENT_ID'),
      client_secret: requireEnv('GOOGLE_CLIENT_SECRET'),
      refresh_token: connection.refresh_token,
      grant_type: 'refresh_token',
    }),
  })

  const data = (await response.json()) as { access_token?: string; expires_in?: number; error?: string; error_description?: string }
  if (!response.ok || !data.access_token) throw new Error(data.error_description || data.error || 'Could not refresh Google token.')

  const expiresAtIso = new Date(Date.now() + (data.expires_in || 3600) * 1000).toISOString()
  await supabaseAdmin
    .from('google_connections')
    .update({ access_token: data.access_token, expires_at: expiresAtIso, updated_at: new Date().toISOString() })
    .eq('id', connection.id)

  return data.access_token
}

const googleFetch = async <T>(url: string, accessToken: string): Promise<T> => {
  const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } })
  const data = (await response.json().catch(() => null)) as T & { error?: { message?: string } }
  if (!response.ok) throw new Error(data?.error?.message || `Google API request failed: ${url}`)
  return data
}

export const listGoogleAccounts = async (accessToken: string) => {
  const data = await googleFetch<{ accounts?: GoogleAccount[] }>(ACCOUNT_MANAGEMENT_URL, accessToken)
  return data.accounts || []
}

export const listGoogleLocationsForAccount = async (accountName: string, accessToken: string) => {
  const params = new URLSearchParams({ readMask: 'name,title,storeCode' })
  const url = `https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations?${params.toString()}`
  const data = await googleFetch<{ locations?: GoogleLocation[] }>(url, accessToken)
  return data.locations || []
}

export const listGoogleReviewsForLocation = async (locationName: string, accessToken: string) => {
  const url = `https://mybusiness.googleapis.com/v4/${locationName}/reviews?orderBy=updateTime desc&pageSize=50`
  const data = await googleFetch<{ reviews?: GoogleReview[] }>(url, accessToken)
  return data.reviews || []
}

export const starRatingToNumber = (rating?: string) => {
  const map: Record<string, number> = {
    ONE: 1,
    TWO: 2,
    THREE: 3,
    FOUR: 4,
    FIVE: 5,
  }
  return map[rating || ''] || 5
}
