export type DataErrorCode = 'UNAUTHENTICATED' | 'AUTH_FAILED' | 'DATABASE_ERROR'

export class DataServiceError extends Error {
  constructor(
    public readonly code: DataErrorCode,
    message: string,
    options?: ErrorOptions
  ) {
    super(message, options)
    this.name = 'DataServiceError'
  }
}
