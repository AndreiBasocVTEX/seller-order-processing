import type { ICargusAwbPayload } from '../dto/cargus-awb.dto'
import {
  defaultEnvelopeCount,
  shipmentPaymentMethod,
} from './cargus-constants.helper'
import {
  getPaymentMethod,
  getTotalDiscount,
  getTotalWeight,
} from '../../core/helpers/order-dto.helper'
import type { IVtexOrder } from '../../vtex/dto/order.dto'
import type { CreateTrackingRequestParams } from '../../shared/clients/carrier-client'
import { priceMultiplier } from '../../shared/enums/constants'
import { TypeOfPayment } from '../../shared/enums/type-of-payment.enum'

export function createCargusOrderPayload(
  order: IVtexOrder,
  senderLocationId: string,
  trackingParams: CreateTrackingRequestParams
): ICargusAwbPayload {
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

  const typeOfPayment = getPaymentMethod(order.openTextField?.value)

  const payment =
    typeOfPayment?.toLowerCase() === TypeOfPayment.CARD
      ? 0
      : value / priceMultiplier

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
