import { json } from 'co-body'

import type { IVtexOrder } from '../../vtex/dto/order.dto'
import type { CarrierValues } from '../../shared/enums/carriers.enum'
import { getVtexAppSettings } from '../utils/getVtexAppSettings'
import { OrderStatus } from '../../vtex/enums/order-status.enum'
import { ValidationError } from '../helpers/error.helper'
import type {
  InvoiceInfoDTO,
  InvoiceRequestDTO,
  NotifyTrackAndInvoicePayload,
  TrackAndInvoiceRequestDTO,
  TrackingInfoDTO,
  TrackingRequestDTO,
} from '../../vtex/dto/track-and-invoice.dto'

export async function trackAndInvoiceHandler(ctx: Context) {
  const {
    vtex: {
      route: { params },
    },
    clients: { vtexOrder: vtexOrderClient },
  } = ctx

  const orderId = params.orderId as string

  const invoiceData: TrackAndInvoiceRequestDTO = await json(ctx.req)

  const { invoice, tracking } = invoiceData

  const order: IVtexOrder = await vtexOrderClient.getVtexOrderData(orderId)

  const trackingInfo = await generateAWB(ctx, tracking, order)

  try {
    const invoiceInfo = await generateInvoice(ctx, invoice, order)

    const notifyInvoiceRequest = { ...trackingInfo, ...invoiceInfo }

    await notifyVtex(ctx, order, notifyInvoiceRequest)
  } catch (error) {
    await deleteAWB(ctx, {
      trackingNumber: trackingInfo.trackingNumber,
      courier: trackingInfo.courier,
    })
    throw new ValidationError({
      message: 'Smartbill invoice generation failed. AWB has been deleted',
    })
  }
}

async function generateAWB(
  ctx: Context,
  tracking: TrackingRequestDTO,
  order: IVtexOrder
): Promise<TrackingInfoDTO> {
  const settings = await getVtexAppSettings(ctx)
  const carrierClient = ctx.clients.carrier

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

  return trackingInfoPayload
}

async function generateInvoice(
  ctx: Context,
  invoice: InvoiceRequestDTO,
  order: IVtexOrder
): Promise<InvoiceInfoDTO> {
  const { smartbill } = ctx.clients
  const settings = await getVtexAppSettings(ctx)

  let invoiceInfoPayload: InvoiceInfoDTO

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

    invoiceInfoPayload = {
      type: 'Output',
      invoiceNumber: smartbillInvoice.number,
      issuanceDate: new Date().toISOString().slice(0, 10), // '2022-02-01'
      invoiceValue: order.value,
      invoiceKey: invoice.provider,
    }
  } else {
    invoiceInfoPayload = {
      ...invoice.params,
      invoiceKey: invoice.provider,
      type: 'Output',
    }
  }

  return invoiceInfoPayload
}

async function notifyVtex(
  ctx: Context,
  order: IVtexOrder,
  notifyInvoiceRequest: NotifyTrackAndInvoicePayload
) {
  const { vtexOrder: vtexOrderClient } = ctx.clients

  const { orderId } = order

  if (order.status === OrderStatus.WINDOW_TO_CANCEL) {
    throw new ValidationError({
      message:
        'You need to wait until the window-to-cancel period ends to generate AWB',
    })
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

async function deleteAWB(
  ctx: Context,
  { trackingNumber, courier }: { trackingNumber: string; courier: string }
) {
  const settings = await getVtexAppSettings(ctx)
  const carrierClient = ctx.clients.carrier

  const carrier = carrierClient.getCarrierClientByName(
    ctx,
    courier as CarrierValues
  )

  return carrier.deleteAWB({ settings, trackingNumber })
}
