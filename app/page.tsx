// app/page.tsx
'use client'

import { Session } from '@supabase/auth-helpers-nextjs'
import MainAppLayout from '@/components/MainAppLayout'
import { MOCK_USER } from '@/lib/mockData' // Usando alias

// Criamos uma sessão "falsa" para passar como prop
// Isso simula um usuário logado
const MOCK_SESSION: Session = {
  access_token: 'mock-token',
  refresh_token: 'mock-refresh',
  user: {
    id: MOCK_USER.id,
    email: MOCK_USER.email,
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  },
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
}

export default function App() {
  // Renderiza diretamente o layout principal do aplicativo
  // e passa a sessão mocada como prop.
  return <MainAppLayout session={MOCK_SESSION} />
}