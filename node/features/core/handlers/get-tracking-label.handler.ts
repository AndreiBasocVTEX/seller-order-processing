import type { CarrierValues } from '../../shared/enums/carriers.enum'
import type { IVtexOrder } from '../../vtex/dto/order.dto'
import { getVtexAppSettings } from '../utils/getVtexAppSettings'

export async function getTrackingLabelHandler(ctx: Context) {
  const {
    vtex: {
      route: { params },
    },
    query: { paperSize },
    clients: { vtexOrder: vtexOrderClient, carrier: carrierClient },
  } = ctx

  const settings = await getVtexAppSettings(ctx)

  const orderId = params.orderId as string
  const order: IVtexOrder = await vtexOrderClient.getVtexOrderData(orderId)

  const {
    courier: carrierName,
    trackingNumber,
  } = order?.packageAttachment?.packages.pop()

  const carrier = carrierClient.getCarrierClientByName(
    ctx,
    carrierName.toLowerCase() as CarrierValues
  )

  carrier.throwIfDisabled(settings)

  const pdfData = await carrier.trackingLabel({
    settings,
    trackingNumber,
    paperSize,
  })

  ctx.res.setHeader('Content-type', 'application/pdf')

  return pdfData
}
