import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { event, token } = body

    if (!token) {
      return NextResponse.json({ success: false, error: 'Token Google não encontrado no servidor' }, { status: 401 })
    }

    console.log("Recebido pedido para Google Calendar:", event.client_name)

    // Calcula Horários (Início e Fim + 1h)
    const startDate = new Date(event.date)
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000) // +1 Hora de duração

    const googleEvent = {
      summary: `📅 ${event.service} - ${event.client_name}`,
      description: `Cliente: ${event.client_name}\nServiço: ${event.service}\nValor: R$ ${event.value}\n\nAgendado via Cérebro.IA`,
      start: {
        dateTime: startDate.toISOString(),
        timeZone: 'America/Sao_Paulo',
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: 'America/Sao_Paulo',
      },
      attendees: event.client_email ? [{ email: event.client_email }] : [],
    }

    // Faz a chamada oficial ao Google
    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(googleEvent),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("Erro Resposta Google:", data)
      return NextResponse.json({ success: false, error: data.error?.message })
    }

    return NextResponse.json({ success: true, link: data.htmlLink })

  } catch (error: any) {
    console.error('Erro Fatal Calendar Route:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
