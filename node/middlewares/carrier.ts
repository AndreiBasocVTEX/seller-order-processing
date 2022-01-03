import { formatError } from '../utils/formatError'
import { getVtexAppSettings } from '../utils/getVtexAppSettings'

export async function updateAWBInfo(
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
    clients: { cargus, sameday, innoship, fancourier, orderApi },
    query: { orderId },
  } = ctx

  try {
    const settings = await getVtexAppSettings(ctx)
    const data = {
      settings,
      orderApi,
      orderId,
    }

    let response

    switch (carrierName) {
      case '_cargus':
        response = await cargus.getAWBInfo(data)

        break

      case '_sameday':
        response = await sameday.getAWBInfo(data)

        break

      case '_innoship':
        response = await innoship.getAWBInfo(data)

        break

      case '_fancourier':
        response = await fancourier.getAWBInfo(data)

        break

      default:
        throw new Error('Carrier is not implemented yet')
    }

    ctx.status = 200
    ctx.body = response
  } catch (e) {
    logger.error(formatError(e))

    ctx.status = 500
    ctx.body = e
  }

  await next()
}
