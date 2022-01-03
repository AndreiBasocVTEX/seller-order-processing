import { json } from 'co-body'

import type { IVtexInvoiceData } from '../types/orderApi'
import { formatError } from '../utils/formatError'
import { getVtexAppSettings } from '../utils/getVtexAppSettings'

export async function sendInvoiceInfoInnoship(
  ctx: Context,
  next: () => Promise<unknown>
) {
  const {
    vtex: { logger },
    clients: { innoship, orderApi },
    query: { orderId },
  } = ctx

  const invoiceData: IVtexInvoiceData = await json(ctx.req)

  try {
    const settings = await getVtexAppSettings(ctx)
    const response = await innoship.sendInvoiceInfoInnoship(
      orderApi,
      settings,
      orderId,
      invoiceData
    )

    ctx.status = 200
    ctx.body = response
  } catch (e) {
    logger.error(formatError(e))

    ctx.status = 500
    ctx.body = e
  }

  await next()
}

export async function printAwbFromInnoship(
  ctx: Context,
  next: () => Promise<unknown>
) {
  const {
    vtex: { logger },
    clients: { innoship },
    query: { awbTrackingNumber },
  } = ctx

  try {
    const settings = await getVtexAppSettings(ctx)

    const response = await innoship.printAwbFromInnoship(
      settings,
      awbTrackingNumber
    )

    ctx.status = 200
    ctx.body = response
  } catch (e) {
    logger.error(formatError(e))

    ctx.status = 500
    ctx.body = e
  }

  await next()
}
