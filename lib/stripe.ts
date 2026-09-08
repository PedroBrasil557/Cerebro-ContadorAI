import 'server-only'

import Stripe from 'stripe'
import { serverEnv } from '@/lib/env/server'

let stripeClient: Stripe | undefined

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
