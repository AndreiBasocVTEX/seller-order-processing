import type { CarrierValues } from '../../shared/enums/carriers.enum'
import type { IVtexOrder } from '../../vtex/dto/order.dto'
import { getVtexAppSettings } from '../utils/getVtexAppSettings'

export async function getTrackingLabelHandler(ctx: Context) {
  const {
    vtex: {
      logger,
      route: { params },
    },
    query: { paperSize },
    clients: { orderApi, carrier: carrierClient },
  } = ctx

  const settings = await getVtexAppSettings(ctx)

  const orderId = params.orderId as string
  const order: IVtexOrder = await orderApi.getVtexOrderData(orderId)

  logger.info({
    handler: 'getTrackingLabelHandler',
    message: 'Request params for a tracking label',
    orderId,
    paperSize,
  })

  const {
    courier: carrierName,
    trackingNumber,
  } = order?.packageAttachment?.packages.pop()

  const carrier = carrierClient.getCarrierClientByName(
    ctx,
    carrierName.toLowerCase() as CarrierValues
  )

  logger.info({
    handler: 'getTrackingLabelHandler',
    message: 'Tracking info for the label',
    carrier,
    trackingNumber,
    orderId,
  })

  carrier.throwIfDisabled(settings)

  const pdfData = await carrier.trackingLabel({
    settings,
    trackingNumber,
    paperSize,
    logger,
  })

  logger.info({
    handler: 'getTrackingLabelHandler',
    message: 'Get AWB PDF',
    carrier,
    trackingNumber,
    pdf: pdfData
      ? 'Tracking label request completed successfully'
      : 'Tracking label request failed',
  })

  ctx.res.setHeader('Content-type', 'application/pdf')

  return pdfData
}
