import type { CarrierValues } from '../enums/carriers.enum'
// import type { IVtexOrder } from '../types/orderApi'
// import type { VtexAuthData } from '../types/VtexAuthData'
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
    clients: { orderApi: vtexOrderClient, carrier: carrierClient },
    query: { orderId },
  } = ctx

  try {
    const settings = await getVtexAppSettings(ctx)

    const carrier = carrierClient.getCarrierClientByName(
      ctx,
      carrierName as CarrierValues
    )

    // const vtexAuthData: VtexAuthData = {
    //   vtex_appKey: settings.vtex_appKey,
    //   vtex_appToken: settings.vtex_appToken,
    // }

    // const order: IVtexOrder = await vtexOrderClient.getVtexOrderData(
    //   vtexAuthData,
    //   orderId
    // )

    const awbReponse = await carrier.getAWBInfo({
      settings,
      orderId,
      orderApi: vtexOrderClient,
    })

    ctx.status = 200
    ctx.body = awbReponse
  } catch (e) {
    logger.error(formatError(e))

    ctx.status = 500
    ctx.body = e
  }

  await next()
}
