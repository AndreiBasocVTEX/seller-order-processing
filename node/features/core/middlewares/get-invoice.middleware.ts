import type { VtexAuthData } from '../../vtex/dto/auth.dto'
import type { IVtexOrder } from '../../vtex/dto/order.dto'
import { formatError } from '../utils/formatError'
import { getVtexAppSettings } from '../utils/getVtexAppSettings'

export async function getInvoiceMiddleware(
  ctx: Context,
  next: () => Promise<unknown>
) {
  const {
    vtex: {
      logger,
      route: { params },
    },
    clients: { vtexOrder: vtexOrderClient, smartbill },
  } = ctx

  try {
    const orderId = params.orderId as string
    const settings = await getVtexAppSettings(ctx)
    const vtexAuthData: VtexAuthData = {
      vtex_appKey: settings.vtex_appKey,
      vtex_appToken: settings.vtex_appToken,
    }

    const order: IVtexOrder = await vtexOrderClient.getVtexOrderData(
      vtexAuthData,
      orderId
    )

    const { invoiceNumber } = order?.packageAttachment?.packages.pop()

    const pdfData = await smartbill.getInvoice({ settings, invoiceNumber })

    ctx.status = 200
    ctx.res.setHeader('Content-type', 'application/pdf')
    ctx.body = pdfData
  } catch (e) {
    logger.error(formatError(e))

    ctx.status = 500
    ctx.body = e
  }

  next()
}
