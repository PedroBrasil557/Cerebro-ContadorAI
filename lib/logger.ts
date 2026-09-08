type LogLevel = 'info' | 'warn' | 'error'

interface LogContext {
  requestId?: string
  feature: string
  userId?: string
  errorCode?: string
}

function maskedUserId(userId?: string) {
  if (!userId) return undefined
  return `${userId.slice(0, 4)}…${userId.slice(-4)}`
}

function write(level: LogLevel, message: string, context: LogContext) {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context,
    userId: maskedUserId(context.userId),
  }

  if (level === 'error') console.error(payload)
  else if (level === 'warn') console.warn(payload)
  else console.info(payload)
}

export const logger = {
  info: (message: string, context: LogContext) => write('info', message, context),
  warn: (message: string, context: LogContext) => write('warn', message, context),
  error: (message: string, context: LogContext) => write('error', message, context),
}
