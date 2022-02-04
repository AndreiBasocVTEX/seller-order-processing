import { json } from 'co-body'

import type { IVtexOrder } from '../../vtex/dto/order.dto'
import type { NotifyInvoicePayload } from '../../vtex/dto/invoice.dto'
import type { CarrierValues } from '../../shared/enums/carriers.enum'
import type { TrackingInfoDTO } from '../../shared/clients/carrier-client'
import type { TrackAndInvoiceRequestDTO } from '../dto/order-api'
import { formatError } from '../utils/formatError'
import { getVtexAppSettings } from '../utils/getVtexAppSettings'
import type { VtexAuthData } from '../../vtex/dto/auth.dto'

export async function trackAndInvoiceMiddleware(
  ctx: Context,
  next: () => Promise<unknown>
) {
  const {
    vtex: {
      logger,
      route: { params },
    },
    clients: { vtexOrder: vtexOrderClient, carrier: carrierClient },
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

      trackingInfoPayload = await carrier.createTracking({
        settings,
        order,
        params: { ...tracking.params },
      })
    } else {
      trackingInfoPayload = {
        courier: tracking.provider,
        trackingNumber: tracking.params.trackingNumber as string,
        trackingUrl: tracking.params.trackingUrl ?? '',
      }
    }

    let notifyInvoiceRequest: NotifyInvoicePayload

    if (invoice.provider === 'smartbill') {
      // add Smartbill integration
      notifyInvoiceRequest = {
        // TODO Finish with SmartBill
        ...trackingInfoPayload,
        type: 'Output',
        invoiceNumber: '',
        items: [],
        issuanceDate: '',
        invoiceValue: 0,
      }
    } else {
      notifyInvoiceRequest = {
        ...trackingInfoPayload,
        ...invoice.params,
        type: 'Output',
      }
    }

    const invoiceInfo = await vtexOrderClient.trackAndInvoice({
      authData: vtexAuthData,
      orderId,
      payload: notifyInvoiceRequest,
    })

    ctx.status = 200
    ctx.body = {
      invoiceInfo,
      trackAndInvoiceDetails: {
        orderId,
        trackingNumber: trackingInfoPayload.trackingNumber,
        trackingUrl: trackingInfoPayload.trackingUrl,
        courier: trackingInfoPayload.courier,
        invoiceNumber: notifyInvoiceRequest.invoiceNumber,
        invoiceUrl: notifyInvoiceRequest.invoiceUrl,
      },
    }
  } catch (e) {
    logger.error(formatError(e))

    ctx.status = 500
    ctx.body = e
  }

  await next()
}
