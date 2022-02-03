import type { IFancourierAwbPayload } from '../types/fancourier'
import type { IVtexOrder, Item, IVtexInvoiceData } from '../types/orderApi'
import {
  defaultCountryCode,
  shipmentPaymentMethod,
  defaultEnvelopeCount,
  awbContent,
  awbSourceChannel,
  pickupServiceId,
} from '../utils/cargusConstants'
import { constants } from '../utils/fancourierConstants'

function getTotalWeight(order: IVtexOrder) {
  return order.items.reduce((weight: number, item: Item) => {
    return weight + item.additionalInfo.dimension.weight * item.quantity
  }, 0)
}

function getTotalDiscount(order: IVtexOrder): number {
  if (!order.paymentData.giftCards.length) {
    return 0
  }

  return order.paymentData.transactions[0].payments.reduce(
    (result: number, item: Item) => {
      if (item.redemptionCode) {
        result -= item.value
      }

      return result
    },
    0
  )
}

/**
 * @TODO: Refactor in favor of requestAWB ( this method should not exist or return direct whats required for formdata )
 */
export function createFancourierOrderPayload(
  order: IVtexOrder,
  warehouseId: string,
  invoiceData: IVtexInvoiceData
): IFancourierAwbPayload {
  const totalWeight = invoiceData.weight
    ? invoiceData.weight
    : getTotalWeight(order)

  const totalDiscount = getTotalDiscount(order)
  const { address } = order.shippingData
  const { courierId } = order?.shippingData?.logisticsInfo?.[0].deliveryIds?.[0]

  const { firstDigits } = order?.paymentData?.transactions?.[0].payments?.[0]
  const paymentPromissory =
    order?.paymentData?.transactions?.[0]?.payments?.[0]?.group ===
    constants.promissory

  // eslint-disable-next-line prefer-destructuring
  let value: number = order.value

  // totalDiscount could be 0 or a negative number
  value += totalDiscount

  const payment =
    firstDigits || paymentPromissory ? 0 : value / constants.price_multiplier

  const numberOfParcels = invoiceData.numberOfParcels
    ? invoiceData.numberOfParcels
    : 1

  const parcels = []

  parcels.push({
    sequenceNo: 1,
    weight: totalWeight,
    type: 2,
    reference1: `Parcel 1`,
    size: { width: 1, height: 1, length: 1 },
  })

  const orderPayload: IFancourierAwbPayload = {
    service: 'Standard',
    shipmentDate: new Date().toISOString(),
    addressFrom: null,
    addressTo: {
      name: address.receiverName,
      contactPerson: address.receiverName,
      country: defaultCountryCode,
      countyName: address.state,
      localityName: address.city,
      street: address.street,
      number: address.number,
      neighborhood: address.neighborhood,
      complement: address.complement,
      reference: address.reference || '',
      postalCode: address.postalCode,
      phone: order.clientProfileData.phone,
      email: order.clientProfileData.email,
    },
    payment: shipmentPaymentMethod,
    content: {
      envelopeCount: defaultEnvelopeCount,
      parcelsCount: numberOfParcels,
      totalWeight,
      contents: awbContent,
      parcels,
    },
    externalClientLocation: warehouseId,
    externalOrderId: order.orderId,
    sourceChannel: awbSourceChannel,
    extra: {
      declaredValue: value / constants.price_multiplier,
      bankRepaymentAmount: payment,
    },
  }

  if (courierId) {
    orderPayload.courierId = courierId
  }

  if (order.shippingData.address.addressType === constants.pickup) {
    orderPayload.serviceId = pickupServiceId
    orderPayload.addressTo.fixedLocationId =
      order.shippingData.address.addressId

    orderPayload.addressTo.localityId = order.shippingData.address.neighborhood
    orderPayload.addressTo.countyName = order.shippingData.address.state
    orderPayload.addressTo.localityName = order.shippingData.address.city
    orderPayload.addressTo.addressText = order.shippingData.address.street
    orderPayload.addressTo.postalCode = order.shippingData.address.postalCode
  }

  return orderPayload
}
