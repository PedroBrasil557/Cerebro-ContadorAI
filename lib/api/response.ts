import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { ApiError } from '@/lib/api/errors'
import { logger, type LogContext } from '@/lib/logger'

export function successResponse<T extends Record<string, unknown>>(
  data: T,
  status = 200
) {
  return NextResponse.json({ success: true, ...data }, { status })
}

export function errorResponse(
  error: unknown,
  context: Omit<LogContext, 'requestId' | 'errorCode'> = { feature: 'api' }
) {
  const requestId = crypto.randomUUID()
  const errorCode = error instanceof ApiError
    ? error.code
    : error instanceof ZodError
      ? 'VALIDATION_ERROR'
      : 'INTERNAL_ERROR'
  const logContext = { ...context, requestId, errorCode }

  if (error instanceof ApiError) {
    const log = error.status >= 500 ? logger.error : logger.warn
    log('API request failed.', logContext)
    return NextResponse.json(
      { success: false, error: { code: error.code, message: error.message, requestId } },
      { status: error.status, headers: { 'x-request-id': requestId } }
    )
  }

  if (error instanceof ZodError) {
    logger.warn('API input validation failed.', logContext)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Os dados enviados são inválidos.',
          requestId,
        },
      },
      { status: 400, headers: { 'x-request-id': requestId } }
    )
  }

  logger.error('Unhandled API failure.', logContext)
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Não foi possível concluir a solicitação.',
        requestId,
      },
    },
    { status: 500, headers: { 'x-request-id': requestId } }
  )
}
