import type { VtexAuthData } from '../types/VtexAuthData'
import { formatError } from '../utils/formatError'
import { getVtexAppSettings } from '../utils/getVtexAppSettings'

export async function getVtexOrderData(
  ctx: Context,
  next: () => Promise<unknown>
) {
  const {
    vtex: {
      logger,
      route: {
        params: { orderId },
      },
    },
    clients: { orderApi },
  } = ctx

  try {
    const settings = await getVtexAppSettings(ctx)
    const vtexAuthData: VtexAuthData = {
      vtex_appKey: settings.vtex_appKey,
      vtex_appToken: settings.vtex_appToken,
    }

    ctx.status = 200
    ctx.body = await orderApi.getVtexOrderData(vtexAuthData, orderId as string)
  } catch (e) {
    logger.error({
      middleware: 'Get VTEX Order Data',
      data: { orderId },
      message: 'Error while getting VTEX Order Data',
      error: formatError(e),
      code: e.code,
    })

    ctx.status = e.code
    ctx.body = e

    return
  }

  await next()
}
