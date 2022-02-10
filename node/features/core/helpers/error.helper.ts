import type { ObjectLiteral } from '../models/object-literal.model'
import type { CustomError } from '../models/request.model'

class CustomErrorConstructor extends Error implements CustomError {
  protected _meta: ObjectLiteral
  protected _statusCode: number

  constructor(
    name: string,
    {
      statusCode,
      message,
      stack,
      meta,
    }: {
      statusCode: number
      message: string
      stack?: string
      meta?: ObjectLiteral
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
  }

  public get meta(): ObjectLiteral {
    return this._meta
  }

  public get statusCode(): number {
    return this._statusCode
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
  }: {
    message: string
    stack?: string
    meta?: ObjectLiteral
  }) {
    super('ValidationError', { message, stack, meta, statusCode: 500 })
  }

  public static fromError(err: Error): UnhandledError {
    return new UnhandledError({
      message: err.message ?? err,
      stack: err.stack as string,
      meta: { raw: JSON.stringify(err, Object.getOwnPropertyNames(err)) },
    })
  }
}
