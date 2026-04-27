export type PlanKey = 'starter' | 'pro' | 'agency'

export type PlanConfig = {
  name: string
  price: number
  priceId: string
  limit: number
  features: string[]
}

const getRequiredPriceId = (
  envValue: string | undefined,
  fallbackValue: string,
  planName: string
): string => {
  const priceId = envValue?.trim() || fallbackValue

  if (!priceId.startsWith('price_')) {
    console.warn(
      `[plans] ${planName} has an invalid Stripe price ID format: ${priceId}`
    )
  }

  return priceId
}

export const PLANS: Record<PlanKey, PlanConfig> = {
  starter: {
    name: 'Starter',
    price: 19,
    priceId: getRequiredPriceId(
      process.env.STRIPE_STARTER_PRICE_ID,
      'price_1TPqHq2f9f4JY5VUJfNVSWf4',
      'Starter'
    ),
    limit: 25,
    features: [
      '25 AI responses per month',
      'Google & Yelp reviews',
      '3 response tones',
      'Copy to clipboard',
    ],
  },
  pro: {
    name: 'Pro',
    price: 49,
    priceId: getRequiredPriceId(
      process.env.STRIPE_PRO_PRICE_ID,
      'price_1TPyQC2f9f4JY5VUExMGNb33',
      'Pro'
    ),
    limit: -1,
    features: [
      'Unlimited AI responses',
      'Google & Yelp reviews',
      '3 response tones',
      'Priority support',
      'Multi-location ready',
    ],
  },
  agency: {
    name: 'Agency',
    price: 149,
    priceId: getRequiredPriceId(
      process.env.STRIPE_AGENCY_PRICE_ID,
      'price_1TPyPJ2f9f4JY5VUrG1c9uas',
      'Agency'
    ),
    limit: -1,
    features: [
      'Unlimited AI responses',
      'Up to 20 client sub-accounts',
      'White-label branding',
      'Custom subdomain',
      'Revenue share dashboard',
      'Priority support',
    ],
  },
}

export const isPlanKey = (value: string): value is PlanKey => {
  return value === 'starter' || value === 'pro' || value === 'agency'
}