import { z } from 'zod'
import nodemailer from 'nodemailer'
import ical, { ICalAttendeeRole, ICalAttendeeStatus, ICalCalendarMethod } from 'ical-generator'
import { errorResponse, successResponse } from '@/lib/api/response'
import { requireUser } from '@/lib/auth/requireUser'
import { serverEnv } from '@/lib/env/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const inputSchema = z.object({
  clientName: z.string().trim().min(2).max(200),
  clientEmail: z.email().optional(),
  service: z.string().trim().min(2).max(200),
  value: z.coerce.number().finite().nonnegative(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  caixaPercentage: z.coerce.number().finite().min(0).max(100).default(20),
  idempotencyKey: z.uuid(),
}).strict()

function normalizeInput(input: unknown) {
  const source = z.record(z.string(), z.unknown()).parse(input)
  return inputSchema.parse({
    clientName: source.clientName ?? source.client_name,
    clientEmail: source.clientEmail ?? source.client_email,
    service: source.service,
    value: source.value,
    date: source.date,
    time: source.time,
    caixaPercentage: source.caixaPercentage ?? source.caixa_percentage ?? 20,
    idempotencyKey: source.idempotencyKey ?? source.idempotency_key,
  })
}

export async function POST(request: Request) {
  try {
    const user = await requireUser()
    const input = normalizeInput(await request.json())
    const supabase = await createClient()
    const { data: appointment, error: insertError } = await supabase
      .from('appointments')
      .insert({
        user_id: user.id,
        client_name: input.clientName,
        client_email: input.clientEmail ?? null,
        service: input.service,
        value: input.value,
        date: input.date,
        time: input.time,
        status: 'agendado',
        caixa_percentage: input.caixaPercentage,
        invite_sent: false,
        invite_status: 'pending',
        idempotency_key: input.idempotencyKey,
      })
      .select()
      .single()

    if (insertError?.code === '23505') {
      const { data: existing, error: existingError } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', user.id)
        .eq('idempotency_key', input.idempotencyKey)
        .single()
      if (existingError) throw existingError
      return successResponse({
        appointment: existing,
        invite: {
          status: existing.invite_status ?? 'pending',
          warning: 'Solicitação já processada; nenhum agendamento duplicado foi criado.',
        },
        idempotentReplay: true,
      })
    }
    if (insertError) throw insertError

    let inviteStatus: 'sent' | 'failed' = 'failed'
    let inviteError: string | null = null

    try {
      if (!serverEnv.SMTP_USER || !serverEnv.SMTP_PASS) {
        throw new Error('SMTP_NOT_CONFIGURED')
      }

      const startTime = new Date(`${input.date}T${input.time}:00-03:00`)
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000)
      const calendar = ical({ name: 'Agenda Cérebro.IA', method: ICalCalendarMethod.REQUEST })
      calendar.createEvent({
        start: startTime,
        end: endTime,
        summary: `${input.clientName} - ${input.service}`,
        description: `Agendamento confirmado.\nCliente: ${input.clientName}\nServiço: ${input.service}\nValor: R$ ${input.value.toFixed(2)}`,
        organizer: { name: 'Cérebro.IA', email: serverEnv.SMTP_USER },
        attendees: input.clientEmail ? [{
          name: input.clientName,
          email: input.clientEmail,
          rsvp: true,
          role: ICalAttendeeRole.REQ,
          status: ICalAttendeeStatus.NEEDSACTION,
        }] : [],
      })

      const recipients = [user.email, input.clientEmail].filter((email): email is string => Boolean(email))
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: serverEnv.SMTP_USER, pass: serverEnv.SMTP_PASS },
      })
      await transporter.sendMail({
        from: `"Agenda Cérebro.IA" <${serverEnv.SMTP_USER}>`,
        to: recipients,
        subject: `Convite: ${input.service} com ${input.clientName}`,
        text: `Agendamento em ${input.date} às ${input.time}.`,
        icalEvent: {
          filename: 'convite.ics',
          method: 'request',
          content: calendar.toString(),
        },
      })
      inviteStatus = 'sent'
    } catch (error) {
      inviteError = error instanceof Error && error.message === 'SMTP_NOT_CONFIGURED'
        ? 'SMTP_NOT_CONFIGURED'
        : 'SMTP_SEND_FAILED'
    }

    const { error: statusError } = await supabase
      .from('appointments')
      .update({
        invite_status: inviteStatus,
        invite_sent: inviteStatus === 'sent',
        invite_error: inviteError,
        invite_sent_at: inviteStatus === 'sent' ? new Date().toISOString() : null,
      })
      .eq('id', appointment.id)
      .eq('user_id', user.id)

    const warning = statusError
      ? 'Agendamento salvo, mas o status do convite não pôde ser atualizado.'
      : inviteStatus === 'failed'
        ? 'Agendamento salvo, mas o convite não foi enviado.'
        : null

    return successResponse({
      appointment: {
        ...appointment,
        invite_status: statusError ? 'pending' : inviteStatus,
        invite_sent: !statusError && inviteStatus === 'sent',
      },
      invite: { status: statusError ? 'pending' : inviteStatus, warning },
    })
  } catch (error) {
    return errorResponse(error, { feature: 'schedule', route: '/api/schedule', provider: 'smtp' })
  }
}
