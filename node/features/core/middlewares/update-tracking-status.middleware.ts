import type { CarrierValues } from '../../shared/enums/carriers.enum'
import type { VtexAuthData } from '../../vtex/dto/auth.dto'
import { formatError } from '../utils/formatError'
import { getVtexAppSettings } from '../utils/getVtexAppSettings'
import type { IVtexOrder } from '../../vtex/dto/order.dto'

export async function updateTrackingStatusMiddleware(
  ctx: Context,
  next: () => Promise<unknown>
) {
  const {
    vtex: {
      logger,
      route: { params },
    },
    clients: { vtexOrder: vtexOrderClient, carrier: carrierClient },
  } = ctx

  const orderId = params.orderId as string

  try {
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
      invoiceNumber,
    } = order?.packageAttachment?.packages.pop()

    const carrier = carrierClient.getCarrierClientByName(
      ctx,
      carrierName.toLowerCase() as CarrierValues
    )

    const trackingInfoPayload = await carrier.getAWBInfo({
      settings,
      order,
    })

    // Do not send events at all if there are no events to send
    if (!trackingInfoPayload.payload.events?.length) {
      trackingInfoPayload.payload.events = undefined
    }

    const trackAwbInfoVtexRes = await vtexOrderClient.updateTrackingStatus({
      authData: vtexAuthData,
      payload: trackingInfoPayload.payload,
      orderId,
      invoiceNumber,
    })

    ctx.status = 200
    ctx.body = {
      vtexResponse: trackAwbInfoVtexRes,
      isDelivered: trackingInfoPayload.payload.isDelivered,
      trackingEvents: trackingInfoPayload.payload.events,
    }
  } catch (e) {
    logger.error(formatError(e))

    ctx.status = 500
    ctx.body = e
  }

  await next()
}
