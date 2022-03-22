import type { Clients } from '../../../clients'
import newOrderTemplate from '../../../templates/new-order.template'
import { getVtexAppSettings } from '../utils/getVtexAppSettings'
import { formatOrderState } from '../../../../libs/localities-mapper/utils/county-list.util'

export async function newOrderBroadcastMiddleware(
  ctx: Context,
  next: () => Promise<any>
) {
  const {
    clients: { emailApi, templateApi, oms },
  } = ctx as { clients: Clients }

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

  const vendorId =
    orderData.openTextField.value.match(/(?<=ID:(\s.*?))(\d+)/g)?.toString() ??
    ''

  const paymentMethod =
    orderData.openTextField.value.match(/\b(\w+)$/g)?.toString() ?? ''

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

  const options = {
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

  await emailApi.sendMail({
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

  await next()
}
