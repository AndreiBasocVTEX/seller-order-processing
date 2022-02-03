import { json } from 'co-body'

import { getVtexAppSettings } from '../utils/getVtexAppSettings'
import { formatError } from '../utils/formatError'
import type { IAuthDataFancourier } from '../types/fancourier'
import type { IVtexInvoiceData } from '../types/orderApi'

export async function getServicesFromFancourier(
  ctx: Context,
  next: () => Promise<unknown>
) {
  const {
    vtex: { logger },
    clients: { fancourier },
  } = ctx

  try {
    const settings = await getVtexAppSettings(ctx)
    const body: IAuthDataFancourier = {
      client_id: settings.fancourier__clientId,
      user_pass: settings.fancourier__password,
      username: settings.fancourier__username,
    }

    const response = await fancourier.getServicesFromFancourier(body)

    ctx.status = 200
    ctx.body = response
  } catch (e) {
    logger.error(formatError(e))

    ctx.status = 500
    ctx.body = e
  }

  await next()
}
