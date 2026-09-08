import { z } from 'zod'
import { errorResponse, successResponse } from '@/lib/api/response'
import { requireUser } from '@/lib/auth/requireUser'

export const dynamic = 'force-dynamic'

const requestSchema = z.object({
  token: z.string().trim().min(20).max(4096),
  event: z.object({
    client_name: z.string().trim().min(2).max(200),
    client_email: z.email().optional(),
    service: z.string().trim().min(2).max(200),
    value: z.coerce.number().finite().nonnegative(),
    date: z.iso.datetime({ offset: true }),
  }).strict(),
}).strict()

const googleResponseSchema = z.object({
  htmlLink: z.url().optional(),
}).passthrough()

export async function POST(request: Request) {
  try {
    await requireUser()
    const { event, token } = requestSchema.parse(await request.json())
    const startDate = new Date(event.date)
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000)

    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary: `${event.service} - ${event.client_name}`,
        description: `Cliente: ${event.client_name}\nServiço: ${event.service}\nValor: R$ ${event.value.toFixed(2)}\n\nAgendado via Cérebro.IA`,
        start: { dateTime: startDate.toISOString(), timeZone: 'America/Sao_Paulo' },
        end: { dateTime: endDate.toISOString(), timeZone: 'America/Sao_Paulo' },
        attendees: event.client_email ? [{ email: event.client_email }] : [],
      }),
    })

    if (!response.ok) throw new Error(`GOOGLE_CALENDAR_${response.status}`)
    const data = googleResponseSchema.parse(await response.json())
    return successResponse({ link: data.htmlLink ?? null })
  } catch (error) {
    return errorResponse(error, { feature: 'calendar', route: '/api/calendar', provider: 'internal' })
  }
}
