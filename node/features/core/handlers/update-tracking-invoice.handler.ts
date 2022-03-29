import type { CarrierValues } from '../../shared/enums/carriers.enum'
import { getVtexAppSettings } from '../utils/getVtexAppSettings'
import type { IVtexOrder } from '../../vtex/dto/order.dto'

export async function updateTrackingStatusHandler(ctx: Context) {
  const {
    vtex: {
      logger,
      route: { params },
    },
    clients: { orderApi, carrier: carrierClient },
  } = ctx

  const orderId = params.orderId as string

  const settings = await getVtexAppSettings(ctx)

  const order: IVtexOrder = await orderApi.getVtexOrderData(orderId)

  logger.info({
    handler: 'updateTrackingStatusHandler',
    message: 'Request from the user + VTEX Order',
    orderId,
    order,
  })

  const {
    courier: carrierName,
    invoiceNumber,
    trackingNumber,
  } = order?.packageAttachment?.packages.pop()

  const carrier = carrierClient.getCarrierClientByName(
    ctx,
    carrierName.toLowerCase() as CarrierValues
  )

  logger.info({
    handler: 'updateTrackingStatusHandler',
    message: 'Invoice and tracking numbers from the order ',
    carrier,
    invoiceNumber,
    trackingNumber,
  })

  carrier.throwIfDisabled(settings)

  const trackingStatus = await carrier.getTrackingStatus({
    settings,
    invoiceNumber,
    trackingNumber,
    logger,
  })

  logger.info({
    handler: 'updateTrackingStatusHandler',
    message: 'Get tracking status from the carrier',
    trackingStatus,
  })

  // Do not send events at all if there are no events to send
  if (!trackingStatus.events?.length) {
    trackingStatus.events = undefined
  }

  const res = await orderApi.updateTrackingStatus({
    payload: trackingStatus,
    orderId,
    invoiceNumber,
  })

  logger.info({
    handler: 'updateTrackingStatusHandler',
    message: 'Update tracking status in VTEX system',
    res,
  })

  return trackingStatus
}
