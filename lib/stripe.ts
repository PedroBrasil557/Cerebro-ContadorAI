import 'server-only'

import Stripe from 'stripe'
import { ServiceUnavailableError } from '@/lib/api/errors'
import { serverEnv } from '@/lib/env/server'

let stripeClient: Stripe | undefined

export type StripeRuntimeMode = 'test' | 'live' | 'unknown'

export function getStripeRuntimeMode(): StripeRuntimeMode {
  if (serverEnv.STRIPE_SECRET_KEY.startsWith('sk_live_')) return 'live'
  if (serverEnv.STRIPE_SECRET_KEY.startsWith('sk_test_')) return 'test'
  return 'unknown'
}

export function assertStripeReadyForCheckout() {
  if (process.env.VERCEL_ENV === 'production' && getStripeRuntimeMode() !== 'live') {
    throw new ServiceUnavailableError(
      'Os pagamentos reais ainda não estão habilitados. A configuração do Stripe em produção está em modo de teste.'
    )
  }
}

export function getStripe() {
  if (stripeClient) return stripeClient

  stripeClient = new Stripe(serverEnv.STRIPE_SECRET_KEY, {
    appInfo: {
      name: 'Cérebro.IA',
      version: '1.0.0',
    },
  })

  return stripeClient
}
