import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import nodemailer from 'nodemailer'
import ical, { ICalCalendarMethod, ICalAttendeeRole, ICalAttendeeStatus } from 'ical-generator'

export async function POST(request: Request) {
  // 1. Cria o cliente Supabase
  const supabase = await createClient()
  
  // 2. Verificação de segurança (Usuário logado)
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user || !user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()

    // 3. Tratamento de Dados (CamelCase -> SnakeCase e Fallbacks)
    const client_name = body.client_name || body.clientName
    const service = body.service
    const value = body.value
    const date = body.date
    const time = body.time
    const caixa_percentage = body.caixa_percentage || body.caixaPercentage || 20
    
    // Email do cliente (Se não vier, usa o do profissional como fallback para teste)
    const client_email = body.client_email || body.clientEmail || user.email

    // Validação de Campos Obrigatórios
    if (!client_name || !service || !value || !date || !time) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 4. Salvar no Banco de Dados (Supabase)
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
        caixa_percentage,
        invite_sent: true
      })
      .select()
      .single()

    if (dbError) throw dbError

    // 5. Configuração de Data e Hora (Fuso Horário BR -03:00)
    // Isso garante que o horário apareça certo no Google Agenda/Outlook
    const startString = `${date}T${time}:00-03:00`
    const startTime = new Date(startString)
    const endTime = new Date(startTime.getTime() + 3600000) // +1 hora de duração (padrão)

    // 6. Gerar o Arquivo de Calendário (iCal)
    const calendar = ical({ 
        name: 'Agenda Cérebro.AI',
        method: ICalCalendarMethod.REQUEST // REQUEST faz aparecer os botões "Sim/Não/Talvez"
    })
    
    calendar.createEvent({
      start: startTime,
      end: endTime,
      summary: `🧠 ${client_name} - ${service}`,
      description: `Agendamento confirmado via Sistema.\n\nCliente: ${client_name}\nServiço: ${service}\nValor: R$ ${value}`,
      location: 'Consultório / Online',
      organizer: { 
          name: user.user_metadata?.full_name || 'Cérebro.AI', 
          email: user.email 
      },
      attendees: [
        // Participante 1: O Profissional (Dono da conta)
        {
            name: 'Profissional',
            email: user.email,
            rsvp: true,
            role: ICalAttendeeRole.REQ,
            status: ICalAttendeeStatus.ACCEPTED
        },
        // Participante 2: O Cliente
        {
            name: client_name,
            email: client_email,
            rsvp: true,
            role: ICalAttendeeRole.REQ,
            // CORREÇÃO DO ERRO DA IMAGEM:
            // "NEEDS_ACTION" não existe, o correto na biblioteca é "NEEDSACTION" (sem underscore)
            status: ICalAttendeeStatus.NEEDSACTION 
        }
      ]
    })

    // 7. Enviar E-mail (Nodemailer)
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        const transporter = nodemailer.createTransport({
            service: 'gmail', // Ou outro serviço SMTP
            auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        })

        // Envia para AMBOS (Profissional e Cliente)
        await transporter.sendMail({
            from: `"Agenda Cérebro.AI" <${process.env.SMTP_USER}>`, 
            to: [user.email, client_email], 
            subject: `Convite: ${service} com ${client_name}`,
            text: `Olá,\n\nUm novo agendamento foi criado.\n\nCliente: ${client_name}\nServiço: ${service}\nData: ${date} às ${time}\n\nPor favor, aceite o convite no anexo para adicionar à sua agenda.`,
            // Anexa o arquivo .ics gerado
            icalEvent: {
                filename: 'convite.ics',
                method: 'request',
                content: calendar.toString()
            }
        })
    }

    return NextResponse.json({ success: true, data: appointment })

  } catch (error: any) {
    console.error("API Error:", error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}