import { expect, test } from '@playwright/test'

test('rejects anonymous checkout requests and arbitrary price ids', async ({ request }) => {
  const response = await request.post('/api/checkout', {
    data: { plan: 'pro', priceId: 'price_attacker_controlled' },
  })
  expect(response.status()).toBe(401)
})

test('rejects a webhook without a Stripe signature', async ({ request }) => {
  const response = await request.post('/api/webhooks/stripe', { data: '{}' })
  expect(response.status()).toBe(400)
})
