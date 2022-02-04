import type { IVtexOrder, TrackingRequestDTO } from '../../../types/order-api'
import type { ICargusAwbPayload } from '../dto/cargus-awb.dto'
import {
  defaultEnvelopeCount,
  priceMultiplier,
  promissory,
  shipmentPaymentMethod,
} from './cargus-constants.helper'
import {
  getTotalDiscount,
  getTotalWeight,
} from '../../core/helpers/helpers.dto'

export function createCargusOrderPayload(
  order: IVtexOrder,
  senderLocationId: string,
  trackingRequest: TrackingRequestDTO
): ICargusAwbPayload {
  const { params: trackingParams } = trackingRequest

  // The selected service does not allow parts weighing more than 31 kg
  const totalWeight = trackingParams.weight
    ? trackingParams.weight
    : getTotalWeight(order)

  const totalOrderDiscount = getTotalDiscount(order)
  let { value } = order

  // totalDiscount could be 0 or a negative number
  // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
  value += totalOrderDiscount

  const numberOfParcels = trackingParams.numberOfParcels
    ? trackingParams.numberOfParcels
    : 1

  const parcels = []

  parcels.push({
    Weight: totalWeight,
    Type: 1,
    Code: 'Parcel 1',
    Length: 10,
    Width: 10,
    Height: 10,
  })

  const { address } = order.shippingData
  const addressText = [
    address.street,
    address.number,
    address.neighborhood,
    address.complement,
    address.reference,
  ]
    .filter(Boolean)
    .join(', ')

  const { firstDigits } = order?.paymentData?.transactions?.[0].payments?.[0]
  const paymentPromissory =
    order.paymentData.transactions[0].payments[0].group === promissory

  const payment = firstDigits || paymentPromissory ? 0 : value / priceMultiplier

  let county = ''
  let locality = ''

  if (
    address.state === 'Bucureşti' ||
    address.state === 'BUCUREŞTI' ||
    address.state === 'B'
  ) {
    county = 'Bucuresti'
    locality = 'Bucuresti'
  } else {
    county = address.state
    locality = address.city
  }

  return {
    DeliveryPudoPoint: null,
    SenderClientId: null,
    TertiaryClientId: null,
    TertiaryLocationId: null,
    Sender: {
      LocationId: senderLocationId || null,
    },
    Recipient: {
      Name: address.receiverName,
      ContactPerson: address.receiverName,
      CountyName: county,
      LocalityName: locality,
      AddressText: addressText,
      PostalCode: address.postalCode,
      PhoneNumber: order.clientProfileData.phone,
      Email: order.clientProfileData.email,
    },
    Parcels: numberOfParcels,
    ServiceId: null,
    Envelopes: defaultEnvelopeCount,
    TotalWeight: totalWeight,
    ShipmentPayer: shipmentPaymentMethod,
    CashRepayment: payment,
    CustomString: order.orderId,
    ParcelCodes: parcels,
  }
}
