import { json } from 'co-body'
import { NotifyInvoceDTO } from '../clients/vtex/notify-invoice.dto'

import type { CarrierValues } from '../enums/carriers.enum'
import type { TrackingInfoDTO } from '../types/carrier-client'
import type { TrackAndInvoiceRequestDTO, IVtexOrder } from '../types/order-api'
import type { VtexAuthData } from '../types/VtexAuthData'
import { formatError } from '../utils/formatError'
import { getVtexAppSettings } from '../utils/getVtexAppSettings'

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

export async function trackAndInvoiceMiddleware(
  ctx: Context,
  next: () => Promise<unknown>
) {
  const {
    vtex: {
      logger,
      route: { params },
    },
    clients: { orderApi: vtexOrderClient, carrier: carrierClient },
  } = ctx

  const orderId = params.orderId as string

  const invoiceData: TrackAndInvoiceRequestDTO = await json(ctx.req)

  const { invoice, tracking } = invoiceData

  try {
    const settings = await getVtexAppSettings(ctx)

    const carrier = carrierClient.getCarrierClientByName(
      ctx,
      tracking.provider as CarrierValues
    )

    const vtexAuthData: VtexAuthData = {
      vtex_appKey: settings.vtex_appKey,
      vtex_appToken: settings.vtex_appToken,
    }

    let trackingInfoPayload: TrackingInfoDTO

    if (tracking.generate) {
      const order: IVtexOrder = await vtexOrderClient.getVtexOrderData(
        vtexAuthData,
        orderId
      )

      trackingInfoPayload = await carrier.requestAWBForInvoice({
        settings,
        order,
        trackingRequest: tracking,
      })
    } else {
      trackingInfoPayload = {
        courier: tracking.provider,
        trackingNumber: tracking.params.trackingNumber as string,
        trackingUrl: tracking.params.trackingUrl ?? '',
      }
    }

    if (invoice.provider === 'smartbill') {
      // add Smartbill integration
    } else {
      trackingInfoPayload = {
        ...trackingInfoPayload,
        ...invoice.params,
      }
    }

    //TODO: finish this
    const notifyInvoiceRequest: NotifyInvoceDTO = {
      ...trackingInfoPayload,
      type: 'Output',
      invoiceNumber: 'string',
      items: [],
      issuanceDate: '',
      invoiceValue: 0

    }

    const invoiceInfo = await vtexOrderClient.trackAndInvoice(
      vtexAuthData,
      orderId,
      notifyInvoiceRequest
    )

    ctx.status = 200
    ctx.body = {
      invoiceInfo,
      trackAndInvoiceDetails: {
        orderId,
        trackingNumber: trackingInfoPayload.trackingNumber,
        trackingUrl: trackingInfoPayload.trackingUrl,
        courier: trackingInfoPayload.courier,
        invoiceNumber: invoice.params.invoiceNumber,
        invoiceUrl: invoice.params.invoiceUrl,
      },
    }
  } catch (e) {
    logger.error(formatError(e))

    ctx.status = 500
    ctx.body = e
  }

  await next()
}

export async function trackingLabelMiddleware(
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
