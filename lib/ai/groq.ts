import 'server-only'

import Groq from 'groq-sdk'
import { serverEnv } from '@/lib/env/server'

let groqClient: Groq | undefined

export function getGroqClient() {
  if (!groqClient) groqClient = new Groq({ apiKey: serverEnv.GROQ_API_KEY })
  return groqClient
}
