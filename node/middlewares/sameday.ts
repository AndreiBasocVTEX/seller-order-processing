import { json } from 'co-body'

import { getVtexAppSettings } from '../utils/getVtexAppSettings'
import { formatError } from '../utils/formatError'
import type { IVtexInvoiceData } from '../types/orderApi'

export async function printAwbFromSameday(
  ctx: Context,
  next: () => Promise<unknown>
) {
  const {
    vtex: { logger },
    clients: { sameday },
    query: { awbTrackingNumber },
  } = ctx

  try {
    const settings = await getVtexAppSettings(ctx)

    const response = await sameday.printAwbFromSameday(
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

export async function sendInvoiceInfoSameday(
  ctx: Context,
  next: () => Promise<unknown>
) {
  const {
    vtex: { logger },
    clients: { sameday, orderApi },
    query: { orderId },
  } = ctx

  const invoiceData: IVtexInvoiceData = await json(ctx.req)

  try {
    const settings = await getVtexAppSettings(ctx)
    const response = await sameday.sendInvoiceInfoSameday(
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
