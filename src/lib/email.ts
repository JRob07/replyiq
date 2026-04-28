import 'server-only'

import { Resend } from 'resend'

const resendApiKey = process.env.RESEND_API_KEY
const fromEmail = process.env.RESEND_FROM_EMAIL || 'ReplyIQ <onboarding@resend.dev>'

export const resend = resendApiKey ? new Resend(resendApiKey) : null

type NewReviewEmailInput = {
  to: string
  reviewerName: string
  rating: number
  platform: string
  reviewText: string
  dashboardUrl: string
}

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')

export const sendNewReviewEmail = async ({
  to,
  reviewerName,
  rating,
  platform,
  reviewText,
  dashboardUrl,
}: NewReviewEmailInput) => {
  if (!resend) {
    console.warn('[email] RESEND_API_KEY missing. Skipping new review email.')
    return
  }

  const safeReviewerName = escapeHtml(reviewerName || 'A customer')
  const safePlatform = escapeHtml(platform || 'Review platform')
  const safeReviewText = escapeHtml(reviewText || '')
  const stars = '★'.repeat(Math.max(0, Math.min(5, rating || 0)))

  const { error } = await resend.emails.send({
    from: fromEmail,
    to,
    subject: `New ${rating}-star review from ${reviewerName || 'a customer'}`,
    html: `
      <div style="font-family: Arial, sans-serif; background:#fbfaf7; padding:32px;">
        <div style="max-width:640px; margin:0 auto; background:#ffffff; border:1px solid #e4e4e7; border-radius:24px; overflow:hidden;">
          <div style="padding:30px;">
            <p style="margin:0 0 8px; color:#71717a; font-size:12px; font-weight:800; letter-spacing:0.14em; text-transform:uppercase;">New Review</p>
            <h1 style="margin:0; color:#111111; font-size:26px; line-height:1.2;">${safeReviewerName} left a new review</h1>
            <p style="margin:12px 0 0; color:#52525b; font-size:15px; line-height:1.7;">ReplyIQ added this review to your dashboard so you can generate a polished response.</p>
            <div style="background:#fafafa; border:1px solid #e4e4e7; border-radius:18px; padding:18px; margin-top:22px;">
              <p style="margin:0 0 8px; color:#111111; font-size:16px; font-weight:800;">${stars} <span style="color:#71717a; font-weight:600;">${rating}/5 on ${safePlatform}</span></p>
              <p style="margin:0; color:#3f3f46; font-size:15px; line-height:1.7;">“${safeReviewText}”</p>
            </div>
            <a href="${dashboardUrl}" style="display:inline-block; margin-top:24px; background:#111111; color:#ffffff; text-decoration:none; padding:12px 18px; border-radius:999px; font-size:14px; font-weight:800;">Open ReplyIQ</a>
          </div>
        </div>
      </div>
    `,
  })

  if (error) console.error('[email] Failed to send new review email:', error)
}
