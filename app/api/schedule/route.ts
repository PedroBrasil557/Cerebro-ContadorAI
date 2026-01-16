import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import nodemailer from 'nodemailer'
import ical, { ICalCalendarMethod } from 'ical-generator'

export async function POST(request: Request) {

  /* ───────────────────────────────
     1. SUPABASE CLIENT (TIPAGEM CORRETA)
  ─────────────────────────────── */
  const supabase = createRouteHandlerClient({
    cookies
  })

  /* ───────────────────────────────
     2. AUTENTICAÇÃO
  ─────────────────────────────── */
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser()

  if (authError || !user || !user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  /* ───────────────────────────────
     3. BODY
  ─────────────────────────────── */
  const body = await request.json()

  const {
    client_name,
    client_email,
    service,
    value,
    date,
    time,
    caixa_percentage
  } = body

  if (!client_name || !service || !value || !date || !time) {
    return NextResponse.json(
      { error: 'Campos obrigatórios faltando' },
      { status: 400 }
    )
  }

  try {
    /* ───────────────────────────────
       4. DATABASE
    ─────────────────────────────── */
    const { data: appointment, error: dbError } = await supabase
      .from('appointments')
      .insert({
        user_id: user.id,
        client_name,
        client_email: client_email || '',
        service,
        value,
        date,
        time,
        status: 'agendado',
        caixa_percentage: caixa_percentage ?? 20,
        invite_sent: true
      })
      .select()
      .single()

    if (dbError) throw dbError

    /* ───────────────────────────────
       5. iCAL
    ─────────────────────────────── */
    const startTime = new Date(`${date}T${time}:00`)
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000)

    const calendar = ical({
      name: 'Cérebro.AI Agenda',
      timezone: 'America/Sao_Paulo'
    })

    calendar.method(ICalCalendarMethod.REQUEST)

    calendar.createEvent({
      start: startTime,
      end: endTime,
      summary: `🧠 ${client_name} - ${service}`,
      description: `
Cliente: ${client_name}
Serviço: ${service}
Valor: R$ ${Number(value).toFixed(2)}
Contato: ${client_email || 'Não informado'}
      `,
      organizer: {
        name: 'Cérebro.AI',
        email: 'no-reply@cerebro.ai'
      },
      attendees: [
        {
          name: 'Profissional',
          email: user.email
        }
      ]
    })

    /* ───────────────────────────────
       6. EMAIL
    ─────────────────────────────── */
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      })

      await transporter.sendMail({
        from: `"Cérebro.AI" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: `📅 Novo agendamento`,
        text: `Agendamento confirmado para ${date} às ${time}.`,
        icalEvent: {
          filename: 'invite.ics',
          method: 'request',
          content: calendar.toString()
        }
      })
    }

    return NextResponse.json({ success: true, data: appointment })

  } catch (error: any) {
    console.error('Schedule Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
