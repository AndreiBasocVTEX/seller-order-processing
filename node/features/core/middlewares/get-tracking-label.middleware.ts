
import type { CarrierValues } from '../../shared/enums/carriers.enum'
import { formatError } from '../utils/formatError'
import { getVtexAppSettings } from '../utils/getVtexAppSettings'

export async function getTrackingLabelMiddleware(
  ctx: Context,
  next: () => Promise<unknown>
) {
  const {
    vtex: { logger },
    clients: { carrier: carrierClient },
    query: { awbTrackingNumber, provider },
  } = ctx

  try {
    const settings = await getVtexAppSettings(ctx)

    const carrier = carrierClient.getCarrierClientByName(
      ctx,
      provider as CarrierValues
    )

    const pdfData = await carrier.trackingLabel({
      settings,
      payload: { awbTrackingNumber },
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
