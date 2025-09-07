import HTTP_STATUS from '~/constants/httpStatus'

type ErrorType = Record<
  string,
  {
    type: string
    value: string
    msg: string
    path: string
    location: string
  }
>

export class ErrorWithStatus {
  message: string
  status: number
  constructor({ message, status }: { message: string; status: number }) {
    this.message = message
    this.status = status
  }
}

export class EntityError extends ErrorWithStatus {
  errors: ErrorType
  constructor({ message, errors }: { message?: string; errors: ErrorType }) {
    super({ message: message ?? 'Entity error', status: HTTP_STATUS.UNPROCESSABLE_ENTITY })
    this.errors = errors
  }
}
