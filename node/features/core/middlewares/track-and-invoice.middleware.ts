import { json } from 'co-body'

import type { IVtexOrder } from '../../vtex/dto/order.dto'
import type { NotifyInvoicePayload } from '../../vtex/dto/invoice.dto'
import type { CarrierValues } from '../../shared/enums/carriers.enum'
import type { TrackingInfoDTO } from '../../shared/clients/carrier-client'
import type { TrackAndInvoiceRequestDTO } from '../dto/order-api.dto'
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
    clients: { vtexOrder: vtexOrderClient, carrier: carrierClient, smartbill },
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

    const order: IVtexOrder = await vtexOrderClient.getVtexOrderData(
      vtexAuthData,
      orderId
    )

    let trackingInfoPayload: TrackingInfoDTO

    if (tracking.generate) {
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

    if (invoice.provider.toLowerCase() === 'smartbill') {
      const smartbillInvoice = await smartbill.generateInvoice({
        settings,
        order,
      })

      notifyInvoiceRequest = {
        ...trackingInfoPayload,
        type: 'Output',
        invoiceNumber: smartbillInvoice.number,
        issuanceDate: new Date().toISOString().slice(0, 10), // '2022-02-01'
        invoiceValue: order.value,
      }
    } else {
      notifyInvoiceRequest = {
        ...trackingInfoPayload,
        ...invoice.params,
        type: 'Output',
      }
    }

    await vtexOrderClient.trackAndInvoice({
      authData: vtexAuthData,
      orderId,
      payload: notifyInvoiceRequest,
    })

    if (order.status === 'ready-for-handling') {
      await vtexOrderClient.setOrderStatusToInvoiced({
        authData: vtexAuthData,
        orderId,
      })
    }

    ctx.status = 200
    ctx.body = {
      ...notifyInvoiceRequest,
    }
  } catch (e) {
    logger.error(formatError(e))

    ctx.status = 500
    ctx.body = e
  }

  await next()
}
