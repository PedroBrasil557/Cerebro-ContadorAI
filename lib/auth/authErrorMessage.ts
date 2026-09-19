export function getAuthErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'Não foi possível concluir a autenticação. Tente novamente.'
  }

  const message = error.message.trim()
  const normalized = message.toLowerCase()
  const name = error.name.toLowerCase()

  if (
    normalized.includes('failed to fetch') ||
    normalized.includes('network') ||
    normalized.includes('fetch failed') ||
    name.includes('authretryablefetcherror')
  ) {
    return 'Não foi possível conectar ao serviço de autenticação. Tente novamente em alguns instantes.'
  }

  if (normalized.includes('invalid login credentials')) {
    return 'E-mail ou senha inválidos.'
  }

  return message || 'Não foi possível concluir a autenticação. Tente novamente.'
}
