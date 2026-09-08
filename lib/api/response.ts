import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { ApiError } from '@/lib/api/errors'

export function successResponse<T extends Record<string, unknown>>(
  data: T,
  status = 200
) {
  return NextResponse.json({ success: true, ...data }, { status })
}

export function errorResponse(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { success: false, error: { code: error.code, message: error.message } },
      { status: error.status }
    )
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Os dados enviados são inválidos.',
        },
      },
      { status: 400 }
    )
  }

  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Não foi possível concluir a solicitação.',
      },
    },
    { status: 500 }
  )
}
