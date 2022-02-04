import type { CarrierValues } from '../../shared/enums/carriers.enum'
import type { VtexAuthData } from '../../shared/dto/VtexAuthData'
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
      route: {
        params: { carrierName },
      },
    },
    clients: { vtexOrder: vtexOrderClient, carrier: carrierClient },
    query: { orderId },
  } = ctx

  try {
    const settings = await getVtexAppSettings(ctx)

    const carrier = carrierClient.getCarrierClientByName(
      ctx,
      carrierName as CarrierValues
    )

    const vtexAuthData: VtexAuthData = {
      vtex_appKey: settings.vtex_appKey,
      vtex_appToken: settings.vtex_appToken,
    }

    const order: IVtexOrder = await vtexOrderClient.getVtexOrderData(
      vtexAuthData,
      orderId
    )

    const trackingInfoPayload = await carrier.getAWBInfo({
      settings,
      order,
    })

    // Do not send events at all if there are no events to send
    if (!trackingInfoPayload.payload.events?.length) {
      trackingInfoPayload.payload.events = undefined
    }

    const trackAwbInfoVtexRes = await vtexOrderClient.trackAWBInfo({
      vtexAuthData,
      payload: trackingInfoPayload.payload,
      pathParams: trackingInfoPayload.pathParams,
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
