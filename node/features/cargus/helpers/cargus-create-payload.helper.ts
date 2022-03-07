import type {
  CargusDataToCreateAwb,
  ICargusAwbPayload,
} from '../dto/cargus-awb.dto'
import { shipmentPaymentMethod } from './cargus-constants.helper'
import {
  getPaymentMethod,
  getTotalDiscount,
} from '../../core/helpers/order-dto.helper'
import { priceMultiplier } from '../../shared/enums/constants'
import { TypeOfPayment } from '../../shared/enums/type-of-payment.enum'
import formatPackageAttachments from './cargus-format-package-attachment.helper'
import localitiesMapper from '../../../../libs/localities-mapper'
import { isString } from '../../core/utils/type-guards'

export async function createCargusOrderPayload({
  order,
  senderLocationId,
  priceTableId,
  trackingParams,
  serviceId,
}: CargusDataToCreateAwb): Promise<ICargusAwbPayload> {
  const totalOrderDiscount = getTotalDiscount(order)
  let { value } = order

  const {
    numberOfParcels,
    numberOfEnvelopes,
    totalWeight,
    packages,
  } = formatPackageAttachments(order, trackingParams)

  // totalDiscount could be 0 or a negative number
  // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
  value += totalOrderDiscount

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

  const { county, locality } = await localitiesMapper(
    'cargus',
    address.state,
    address.city
  )

  if (
    address.state === 'Bucureşti' ||
    address.state === 'BUCUREŞTI' ||
    address.state === 'B'
  ) {
    address.state = 'Bucuresti'
    address.city = 'Bucuresti'
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
      Name: order.clientProfileData.isCorporate
        ? order.clientProfileData.corporateName
        : address.receiverName,
      ContactPerson: address.receiverName,
      CountyName: isString(county),
      LocalityName: isString(locality),
      AddressText: addressText,
      PostalCode: address.postalCode,
      PhoneNumber: order.clientProfileData.phone,
      Email: order.clientProfileData.email,
    },
    Parcels: numberOfParcels,
    PriceTableId: priceTableId,
    ServiceId: serviceId,
    // Max num of envelopes — 9
    Envelopes: numberOfEnvelopes,
    TotalWeight: totalWeight,
    ShipmentPayer: shipmentPaymentMethod,
    CashRepayment: payment,
    CustomString: order.orderId,
    ParcelCodes: packages,
  }
}
