export type ApiErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMITED'
  | 'NOT_FOUND'
  | 'INTERNAL_ERROR'

export class ApiError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    public readonly status: number,
    message: string
  ) {
    super(message)
    this.name = new.target.name
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = 'Autenticação necessária.') {
    super('UNAUTHORIZED', 401, message)
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = 'Você não tem permissão para realizar esta ação.') {
    super('FORBIDDEN', 403, message)
  }
}

export class ValidationError extends ApiError {
  constructor(message = 'Os dados enviados são inválidos.') {
    super('VALIDATION_ERROR', 400, message)
  }
}

export class RateLimitError extends ApiError {
  constructor(message = 'Limite de uso atingido. Tente novamente mais tarde.') {
    super('RATE_LIMITED', 429, message)
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'Recurso não encontrado.') {
    super('NOT_FOUND', 404, message)
  }
}
