import { UnhandledError } from '../helpers/error.helper'
import { formatError } from '../helpers/formatError'
import type { Handler, Next } from '../models/request.model'

export function errorHandleMiddleware(handler: Handler) {
  return async function errorMiddleware(
    ctx: Context,
    next: Next
  ): Promise<void> {
    const {
      vtex: { logger },
    } = ctx

    try {
      const response = await handler(ctx)

      ctx.status = 200
      // 201 no content will never be the case
      ctx.body = response ?? { success: true }

      return next()
    } catch (error) {
      logger.error({
        handler: `${handler}`,
        data: formatError(error),
      })

      const handledError = error.statusCode
        ? error
        : UnhandledError.fromError(error)

      // Error is handled
      ctx.status = handledError.statusCode
      ctx.body = {
        message: handledError.message,
        stack: handledError.stack,
        meta: handledError.meta,
        errors: handledError.errors,
      }

      // eslint-disable-next-line no-console
      console.log(
        `Request ${ctx.request.path} failed with ${handledError.message}`
      )

      return next()
    }
  }
}
