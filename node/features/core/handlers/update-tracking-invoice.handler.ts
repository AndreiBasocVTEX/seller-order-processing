import type { CarrierValues } from '../../shared/enums/carriers.enum'
import type { VtexAuthData } from '../../vtex/dto/auth.dto'
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
    authData: vtexAuthData,
    payload: trackingStatus,
    orderId,
    invoiceNumber,
  })

  return trackingStatus
}
