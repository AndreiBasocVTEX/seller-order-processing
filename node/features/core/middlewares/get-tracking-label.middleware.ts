import type { CarrierValues } from '../../shared/enums/carriers.enum'
import type { VtexAuthData } from '../../vtex/dto/auth.dto'
import type { IVtexOrder } from '../../vtex/dto/order.dto'
import { formatError } from '../utils/formatError'
import { getVtexAppSettings } from '../utils/getVtexAppSettings'

export async function getTrackingLabelMiddleware(
  ctx: Context,
  next: () => Promise<unknown>
) {
  const {
    vtex: {
      logger,
      route: { params },
    },
    query: { paperSize },
    clients: { vtexOrder: vtexOrderClient, carrier: carrierClient },
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

    const {
      courier: carrierName,
      trackingNumber,
    } = order?.packageAttachment?.packages.pop()

    const carrier = carrierClient.getCarrierClientByName(
      ctx,
      carrierName.toLowerCase() as CarrierValues
    )

    const pdfData = await carrier.trackingLabel({
      settings,
      trackingNumber,
      paperSize,
    })

    ctx.status = 200
    ctx.body = pdfData
  } catch (e) {
    logger.error(formatError(e))

    ctx.status = 500
    ctx.body = e
  }

  await next()
}
