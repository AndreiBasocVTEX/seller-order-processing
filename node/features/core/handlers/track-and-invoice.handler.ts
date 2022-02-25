import { json } from 'co-body'

import type { IVtexOrder } from '../../vtex/dto/order.dto'
import type { NotifyInvoicePayload } from '../../vtex/dto/invoice.dto'
import type { CarrierValues } from '../../shared/enums/carriers.enum'
import type { TrackingInfoDTO } from '../../shared/clients/carrier-client'
import type { TrackAndInvoiceRequestDTO } from '../dto/order-api.dto'
import { getVtexAppSettings } from '../utils/getVtexAppSettings'
import { OrderStatus } from '../../vtex/enums/order-status.enum'
import { ValidationError } from '../helpers/error.helper'

export async function trackAndInvoiceHandler(ctx: Context) {
  const {
    vtex: {
      route: { params },
    },
    clients: { vtexOrder: vtexOrderClient, carrier: carrierClient, smartbill },
  } = ctx

  const orderId = params.orderId as string

  const invoiceData: TrackAndInvoiceRequestDTO = await json(ctx.req)

  const { invoice, tracking } = invoiceData

  const settings = await getVtexAppSettings(ctx)

  const order: IVtexOrder = await vtexOrderClient.getVtexOrderData(orderId)

  if (order.status === OrderStatus.WINDOW_TO_CANCEL) {
    throw new ValidationError({
      message:
        'You need to wait until the window-to-cancel period ends to generate AWB',
    })
  }

  let trackingInfoPayload: TrackingInfoDTO

  if (tracking.generate) {
    const carrier = carrierClient.getCarrierClientByName(
      ctx,
      tracking.provider as CarrierValues
    )

    if (!settings[`${tracking.provider}__isEnabled`]) {
      throw new ValidationError({
        message: `You need to enable ${tracking.provider} integration to perform this action`,
      })
    }

    trackingInfoPayload = await carrier.createTracking({
      settings,
      order,
      params: { ...tracking.params },
    })
  } else if (tracking.params.trackingNumber) {
    trackingInfoPayload = {
      courier: tracking.provider,
      trackingNumber: tracking.params.trackingNumber,
      trackingUrl: tracking.params.trackingUrl ?? '',
    }
  } else {
    throw new ValidationError({
      message: 'Tracking number is required for manual input',
    })
  }

  let notifyInvoiceRequest: NotifyInvoicePayload

  if (invoice.provider.toLowerCase() === 'smartbill') {
    if (!settings.smartbill__isEnabled) {
      throw new ValidationError({
        message:
          'You need to enable Smartbill integration to perform this action',
      })
    }

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
      invoiceKey: invoice.provider,
    }
  } else {
    notifyInvoiceRequest = {
      ...trackingInfoPayload,
      ...invoice.params,
      invoiceKey: invoice.provider,
      type: 'Output',
    }
  }

  await vtexOrderClient.trackAndInvoice({
    orderId,
    payload: notifyInvoiceRequest,
  })

  if (order.status === OrderStatus.READY_FOR_HANDLING) {
    await vtexOrderClient.setOrderStatusToInvoiced({
      orderId,
    })
  }

  return notifyInvoiceRequest
}
