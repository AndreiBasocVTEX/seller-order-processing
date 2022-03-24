import type { EventContext } from '@vtex/api'

import type { Clients } from '../../../clients'
import newOrderTemplate from '../../../templates/new-order.template'
import {
  parseStringIntoObject,
  OpenTextFields,
} from '../../../../libs/common-utils/object.utils'
import { getVtexAppSettings } from '../utils/getVtexAppSettings'
import { formatOrderState } from '../../../../libs/localities-mapper/utils/county-list.util'

export async function newOrderBroadcastMiddleware(
  ctx: EventContext<Clients>,
  next: () => Promise<never>
) {
  const {
    vtex: { logger },
    clients: { emailApi, templateApi, oms },
  } = ctx

  const settings = await getVtexAppSettings(ctx)

  if (
    !settings.notifications__isEnabled ||
    !settings.notifications__emailList?.length
  ) {
    return
  }

  const templateName = 'order-processing-new-order'
  const isTemplateAvailable = await templateApi.getTemplate(
    templateName,
    newOrderTemplate
  )

  if (!isTemplateAvailable) {
    await templateApi.createTemplate(templateName, newOrderTemplate)
  }

  const orderData = await oms.order(ctx.body.orderId)
  const openFieldData = parseStringIntoObject(orderData.openTextField)

  const vendorId = openFieldData[OpenTextFields.vendorOrderId] ?? ''
  const paymentMethod = openFieldData[OpenTextFields.paymentMethod] ?? ''

  logger?.info({
    middleware: 'newOrderBroadcastMiddleware',
    message: 'Get order data from VTEX system',
    orderData,
  })

  const itemsNormalized = orderData.items.map(
    ({
      name,
      quantity,
      price,
    }: {
      name: string
      quantity: number
      price: number
    }) => {
      return {
        name,
        quantity,
        price: new Intl.NumberFormat('fr-FR').format(price / 100),
      }
    }
  )

  logger?.info({
    middleware: 'newOrderBroadcastMiddleware',
    message: 'Normalized items, vendor ID and payment method',
    vendorId,
    paymentMethod,
    itemsNormalized,
  })

  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour12: false,
  }

  const county = formatOrderState(orderData.shippingData.address.state)

  const emailJson = {
    orderId: orderData.orderId,
    creationDate: new Intl.DateTimeFormat('ro-RO', {
      ...options,
      hour: 'numeric',
      minute: 'numeric',
      timeZone: 'Europe/Bucharest',
    }).format(new Date(orderData.creationDate)),
    shippingData: orderData.shippingData,
    clientProfileData: orderData.clientProfileData,
    invoiceData: orderData.invoiceData,
    vendorOrderId: vendorId,
    hostname: orderData.hostname,
    paymentMethod,
    items: itemsNormalized,
    value: orderData.value / 100,
    transportPrice: orderData.shippingData.logisticsInfo[0]?.price / 100 || 0,
    deliveryEstimate: new Intl.DateTimeFormat('ro-RO', options).format(
      new Date(
        orderData.shippingData.logisticsInfo[0].shippingEstimateDate?.toString() ||
          ''
      )
    ),
    county,
  }

  logger?.info({
    middleware: 'newOrderBroadcastMiddleware',
    message: 'Create email JSON',
    emailJson,
  })

  const res = await emailApi.sendMail({
    TemplateName: templateName,
    applicationName: ctx.vtex.userAgent,
    logEvidence: false,
    jsonData: {
      to: {
        name: orderData.clientProfileData.lastName,
        email: settings.notifications__emailList,
        subject: 'New Marketplace Order',
      },
      ...emailJson,
    },
  })

  logger?.info({
    middleware: 'newOrderBroadcastMiddleware',
    message: 'Response after send mail',
    res,
  })

  await next()
}
