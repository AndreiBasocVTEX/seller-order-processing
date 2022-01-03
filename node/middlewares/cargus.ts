import { json } from 'co-body'

import { getVtexAppSettings } from '../utils/getVtexAppSettings'
import { formatError } from '../utils/formatError'
import type { IVtexInvoiceData } from '../types/orderApi'

export async function printAwbFromCargus(
  ctx: Context,
  next: () => Promise<unknown>
) {
  const {
    vtex: { logger },
    clients: { cargus },
    query: { awbTrackingNumber },
  } = ctx

  try {
    const settings = await getVtexAppSettings(ctx)

    const response = await cargus.printAwbFromCargus(
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

export async function sendInvoiceInfoCargus(
  ctx: Context,
  next: () => Promise<unknown>
) {
  const {
    vtex: { logger },
    clients: { cargus, orderApi },
    query: { orderId },
  } = ctx

  const invoiceData: IVtexInvoiceData = await json(ctx.req)

  try {
    const settings = await getVtexAppSettings(ctx)
    const response = await cargus.sendInvoiceInfoCargus(
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
