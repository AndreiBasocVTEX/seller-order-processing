import type { IVtexOrder } from '../../vtex/dto/order.dto'
import { getVtexAppSettings } from '../utils/getVtexAppSettings'

export async function getInvoiceHandler(ctx: Context) {
  const {
    vtex: {
      route: { params },
    },
    clients: { orderApi, smartbill },
  } = ctx

  const settings = await getVtexAppSettings(ctx)

  smartbill.throwIfDisabled(settings)

  const orderId = params.orderId as string

  const order: IVtexOrder = await orderApi.getVtexOrderData(orderId)

  const { invoiceNumber } = order?.packageAttachment?.packages.pop()

  return smartbill.getInvoice({ settings, invoiceNumber })
}
