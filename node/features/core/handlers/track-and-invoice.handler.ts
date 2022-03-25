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
import { formatError } from '../helpers/formatError'

export async function trackAndInvoiceHandler(ctx: Context) {
  const {
    vtex: {
      logger,
      route: { params },
    },
    clients: { orderApi },
  } = ctx

  logger.info({
    handler: 'trackAndInvoiceHandler',
    message: 'Request from the user',
    request: ctx.req, // ?? Should we show 'ctx.req' or 'await json(ctx.req)'?
    orderId: params.orderId,
  })

  const orderId = params.orderId as string

  const invoiceData: TrackAndInvoiceRequestDTO = await json(ctx.req)

  const { invoice, tracking } = invoiceData

  logger.info({
    handler: 'trackAndInvoiceHandler',
    message: 'Tracking and invoice data from the user',
    tracking,
    invoice,
  })

  const order: IVtexOrder = await orderApi.getVtexOrderData(orderId)

  logger.info({
    handler: 'trackAndInvoiceHandler',
    message: 'Order data from VTEX',
    order,
    orderId,
    orderStatus: order.status,
  })

  if (order.status === OrderStatus.WINDOW_TO_CANCEL) {
    throw new ValidationError({
      message:
        'You need to wait until the window-to-cancel period ends to generate AWB',
    })
  }

  const trackingInfo = await generateAWB(ctx, tracking, order)

  logger.info({
    handler: 'trackAndInvoiceHandler',
    message: 'Tracking info',
    trackingInfo,
  })

  try {
    const invoiceInfo = await generateInvoice(ctx, invoice, order)

    logger.info({
      handler: 'trackAndInvoiceHandler',
      message: 'Invoice info',
      invoiceInfo,
    })

    const notifyInvoiceRequest = { ...trackingInfo, ...invoiceInfo }

    logger.info({
      handler: 'trackAndInvoiceHandler',
      message:
        'Combine tracking and invoice info into invoice request for VTEX',
      invoiceInfo,
    })

    const invoiceOrder = await notifyVtex(ctx, order, notifyInvoiceRequest)

    logger.info({
      handler: 'trackAndInvoiceHandler',
      message: 'Invoice the order in the VTEX system',
      invoiceOrder,
    })
  } catch (error) {
    const deleteAWBFromCarrier = await deleteAWB(ctx, {
      trackingNumber: trackingInfo.trackingNumber,
      courier: trackingInfo.courier,
    })

    logger.info({
      handler: 'trackAndInvoiceHandler',
      message: 'Invoice the order in the VTEX system',
      status: deleteAWBFromCarrier,
    })

    logger?.error({
      data: formatError(error),
    })

    throw new ValidationError({
      message: 'SmartBill invoice generation failed. AWB has been deleted',
    })
  }
}

async function generateAWB(
  ctx: Context,
  tracking: TrackingRequestDTO,
  order: IVtexOrder
): Promise<TrackingInfoDTO> {
  const {
    vtex: { logger },
  } = ctx

  const settings = await getVtexAppSettings(ctx)
  const carrierClient = ctx.clients.carrier

  logger.info({
    handler: 'trackAndInvoiceHandler',
    function: 'generateAWB',
    message: 'Invoice the order in the VTEX system',
  })

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
      logger,
    })

    logger.info({
      handler: 'trackAndInvoiceHandler',
      function: 'generateAWB',
      message: 'Tracking payload if "tracking.generate" = true',
      carrier: tracking.provider,
      orderId: order.orderId,
      trackingInfoPayload,
    })
  } else if (tracking.params.trackingNumber) {
    trackingInfoPayload = {
      courier: tracking.provider,
      trackingNumber: tracking.params.trackingNumber,
      trackingUrl: tracking.params.trackingUrl ?? '',
    }

    logger.info({
      handler: 'trackAndInvoiceHandler',
      function: 'generateAWB',
      message: 'Tracking payload if "tracking.generate" = false',
      carrier: tracking.provider,
      orderId: order.orderId,
      trackingInfoPayload,
    })
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
  const {
    clients: { smartbill },
    vtex: { logger },
  } = ctx

  const settings = await getVtexAppSettings(ctx)

  let invoiceInfoPayload: InvoiceInfoDTO

  if (invoice.provider.toLowerCase() === 'smartbill') {
    if (!settings.smartbill__isEnabled) {
      throw new ValidationError({
        message:
          'You need to enable SmartBill integration to perform this action',
      })
    }

    const smartbillInvoice = await smartbill.generateInvoice({
      settings,
      logger,
      order,
    })

    logger.info({
      handler: 'trackAndInvoiceHandler',
      function: 'generateInvoice',
      message: 'Smartbill invoice',
      orderId: order.orderId,
      smartbillInvoice,
    })

    invoiceInfoPayload = {
      type: 'Output',
      invoiceNumber: smartbillInvoice.number,
      issuanceDate: new Date().toISOString().slice(0, 10), // '2022-02-01'
      invoiceValue: order.value,
      invoiceKey: invoice.provider,
    }

    logger.info({
      handler: 'trackAndInvoiceHandler',
      function: 'generateInvoice',
      message: 'Invoice for VTEX with smartbill`s data',
      orderId: order.orderId,
      invoiceInfoPayload,
    })
  } else {
    invoiceInfoPayload = {
      ...invoice.params,
      invoiceKey: invoice.provider,
      type: 'Output',
    }

    logger.info({
      handler: 'trackAndInvoiceHandler',
      function: 'generateInvoice',
      message: 'Invoice for VTEX with manual input',
      orderId: order.orderId,
      invoiceInfoPayload,
    })
  }

  return invoiceInfoPayload
}

async function notifyVtex(
  ctx: Context,
  order: IVtexOrder,
  notifyInvoiceRequest: NotifyTrackAndInvoicePayload
) {
  const {
    clients: { orderApi },
    vtex: { logger },
  } = ctx

  const { orderId } = order

  await orderApi.trackAndInvoice({
    orderId,
    payload: notifyInvoiceRequest,
  })

  logger.info({
    handler: 'trackAndInvoiceHandler',
    function: 'notifyVtex',
    orderStatus: order.status,
  })

  if (order.status === OrderStatus.READY_FOR_HANDLING) {
    const res = await orderApi.setOrderStatusToInvoiced(orderId)

    logger.info({
      handler: 'trackAndInvoiceHandler',
      function: 'notifyVtex',
      orderStatus: order.status,
      responseStatus: res,
    })
  }

  return notifyInvoiceRequest
}

async function deleteAWB(
  ctx: Context,
  { trackingNumber, courier }: { trackingNumber: string; courier: string }
) {
  const {
    vtex: { logger },
  } = ctx

  logger.info({
    handler: 'trackAndInvoiceHandler',
    function: 'deleteAWB',
    message: 'Request to delete AWB',
    trackingNumber,
    courier,
  })

  const settings = await getVtexAppSettings(ctx)
  const carrierClient = ctx.clients.carrier

  const carrier = carrierClient.getCarrierClientByName(
    ctx,
    courier as CarrierValues
  )

  return carrier.deleteAWB({ settings, trackingNumber, logger })
}
