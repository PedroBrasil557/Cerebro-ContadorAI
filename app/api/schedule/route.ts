import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import nodemailer from 'nodemailer'
import ical, { ICalCalendarMethod, ICalAttendeeRole, ICalAttendeeStatus } from 'ical-generator'

export async function POST(request: Request) {
  const supabase = await createClient()
  
  // Verificação de segurança
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user || !user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()

  // 1. CORREÇÃO "MISSING FIELDS": Mapeamento CamelCase -> SnakeCase
  // O frontend manda "clientName", o banco quer "client_name"
  const client_name = body.client_name || body.clientName
  const service = body.service
  const value = body.value
  const date = body.date
  const time = body.time
  const caixa_percentage = body.caixa_percentage || body.caixaPercentage
  
  // Fallback para e-mail
  const client_email = body.client_email || body.clientEmail || user.email

  if (!client_name || !service || !value || !date || !time) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  try {
    // 2. Salvar no Banco
    const { data: appointment, error: dbError } = await supabase
      .from('appointments')
      .insert({
        user_id: user.id,
        client_name,
        client_email,
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

    // 3. Gerar iCal (CORREÇÃO DO ERRO DE TIPO REQ_PARTICIPANT)
    const startTime = new Date(`${date}T${time}:00`)
    const calendar = ical({ name: 'Agenda Cérebro.AI' })
    calendar.method(ICalCalendarMethod.REQUEST)
    
    calendar.createEvent({
      start: startTime,
      end: new Date(startTime.getTime() + 3600000), // 1 hora
      summary: `🧠 ${client_name} - ${service}`,
      location: 'Consultório',
      organizer: { name: 'Cérebro.AI', email: 'no-reply@cerebro.ai' },
      attendees: [{
        name: 'Profissional',
        email: user.email,
        rsvp: true,
        role: ICalAttendeeRole.REQ, // <--- O VS Code aceita apenas assim
        status: ICalAttendeeStatus.ACCEPTED
      }]
    })

    // 4. Enviar E-mail
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        })
        await transporter.sendMail({
            from: 'Cérebro.AI', 
            to: user.email, 
            subject: `Novo Agendamento: ${client_name}`,
            text: `Cliente: ${client_name}\nServiço: ${service}\nValor: R$ ${value}`,
            icalEvent: { filename: 'invite.ics', method: 'request', content: calendar.toString() }
        })
    }

    return NextResponse.json({ success: true, data: appointment })
  } catch (error: any) {
    console.error("API Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}