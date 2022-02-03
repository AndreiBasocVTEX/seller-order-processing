import { json } from 'co-body'

import type { CarrierValues } from '../enums/carriers.enum'
import type { RequestAWBForInvoiceResponse } from '../types/carrier-client'
import type { IVtexInvoiceData, IVtexOrder } from '../types/orderApi'
import type { VtexAuthData } from '../types/VtexAuthData'
import { formatError } from '../utils/formatError'
import { getVtexAppSettings } from '../utils/getVtexAppSettings'

export async function updateAWBInfoMiddleware(
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

export async function sendInvoiceInfoMiddleware(
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

  const invoiceData: IVtexInvoiceData = await json(ctx.req)

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

    const trackingInfoPayload: RequestAWBForInvoiceResponse = await carrier.requestAWBForInvoice(
      {
        settings,
        order,
        invoiceData,
      }
    )

    const invoiceInfo = await vtexOrderClient.sendInvoiceInfo(
      vtexAuthData,
      trackingInfoPayload
    )

    ctx.status = 200
    ctx.body = {
      invoiceInfo,
      updatedItems: {
        orderId,
        trackingNumber: trackingInfoPayload.trackingNumber,
        items: trackingInfoPayload.items,
        courier: trackingInfoPayload.courier,
        trackingUrl: trackingInfoPayload.trackingUrl,
      },
    }
  } catch (e) {
    logger.error(formatError(e))

    ctx.status = 500
    ctx.body = e
  }

  await next()
}

export async function printAWBMiddleware(
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
    clients: { carrier: carrierClient },
    query: { awbTrackingNumber },
  } = ctx

  try {
    const settings = await getVtexAppSettings(ctx)

    const carrier = carrierClient.getCarrierClientByName(
      ctx,
      carrierName as CarrierValues
    )

    const pdfData = await carrier.printAWB({
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
