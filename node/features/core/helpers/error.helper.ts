import type { AxiosError } from 'axios'

import type { ObjectLiteral } from '../models/object-literal.model'
import type { CustomError } from '../models/request.model'

class CustomErrorConstructor extends Error implements CustomError {
  protected _meta: ObjectLiteral
  protected _statusCode: number
  protected _errors?: ObjectLiteral[]

  constructor(
    name: string,
    {
      statusCode,
      message,
      stack,
      meta,
      errors,
    }: {
      statusCode: number
      message: string
      stack?: string
      meta?: ObjectLiteral
      errors?: ObjectLiteral[]
    }
  ) {
    super(message)

    this.name = name
    this._meta = meta ?? {}

    // Set stack to ignore current error constructor
    this.stack = (stack ?? super.stack ?? new Error().stack)
      ?.split('\n')
      .filter((line) => !line.includes('error.helper'))
      .join('\n')

    this._statusCode = statusCode

    this._errors = errors ?? []
  }

  public get meta(): ObjectLiteral {
    return this._meta
  }

  public get statusCode(): number {
    return this._statusCode
  }

  public get errors(): ObjectLiteral[] | undefined {
    return this._errors
  }
}

export class ValidationError extends CustomErrorConstructor {
  constructor({
    message,
    stack,
    meta,
  }: {
    message: string
    stack?: string
    meta?: ObjectLiteral
  }) {
    super('ValidationError', { message, stack, meta, statusCode: 400 })
  }
}

export class UnhandledError extends CustomErrorConstructor {
  constructor({
    message,
    stack,
    meta,
    errors,
  }: {
    message: string
    stack?: string
    meta?: ObjectLiteral
    errors?: ObjectLiteral[]
  }) {
    super('ValidationError', { message, stack, meta, statusCode: 500, errors })
  }

  public static fromError(err: AxiosError): UnhandledError {
    return new UnhandledError({
      message: err.message ?? err,
      stack: err.stack as string,
      meta: {
        raw: JSON.stringify(err, Object.getOwnPropertyNames(err)),
        data: err.response?.data,
      },
    })
  }
}
