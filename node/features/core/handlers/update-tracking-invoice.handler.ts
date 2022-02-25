import type { CarrierValues } from '../../shared/enums/carriers.enum'
import { getVtexAppSettings } from '../utils/getVtexAppSettings'
import type { IVtexOrder } from '../../vtex/dto/order.dto'

export async function updateTrackingStatusHandler(ctx: Context) {
  const {
    vtex: {
      route: { params },
    },
    clients: { vtexOrder: vtexOrderClient, carrier: carrierClient },
  } = ctx

  const orderId = params.orderId as string

  const settings = await getVtexAppSettings(ctx)

  const order: IVtexOrder = await vtexOrderClient.getVtexOrderData(orderId)

  const {
    courier: carrierName,
    invoiceNumber,
    trackingNumber,
  } = order?.packageAttachment?.packages.pop()

  const carrier = carrierClient.getCarrierClientByName(
    ctx,
    carrierName.toLowerCase() as CarrierValues
  )

  carrier.throwIfDisabled(settings)

  const trackingStatus = await carrier.getTrackingStatus({
    settings,
    invoiceNumber,
    trackingNumber,
  })

  // Do not send events at all if there are no events to send
  if (!trackingStatus.events?.length) {
    trackingStatus.events = undefined
  }

  await vtexOrderClient.updateTrackingStatus({
    payload: trackingStatus,
    orderId,
    invoiceNumber,
  })

  return trackingStatus
}
