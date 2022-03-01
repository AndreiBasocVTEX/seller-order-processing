import {
  getTotalDiscount,
  getPaymentMethod,
} from '../../core/helpers/order-dto.helper'
import type { CreateTrackingRequestParams } from '../../shared/clients/carrier-client'
import { priceMultiplier } from '../../shared/enums/constants'
import { TypeOfPayment } from '../../shared/enums/type-of-payment.enum'
import type { IVtexOrder } from '../../vtex/dto/order.dto'
import type { ISamedayAwbPayload } from '../dto/sameday-awb.dto'
import {
  selectedPickup,
  pickupServiceId,
  pickup,
} from './sameday-constants.helper'
import formatPackageAttachments from './sameday-format-package-attachment.helper'

export function createOrderPayload(
  order: IVtexOrder,
  countyId: number,
  trackingParams: CreateTrackingRequestParams
): ISamedayAwbPayload {
  const totalOrderDiscount = getTotalDiscount(order)
  let { value } = order

  // totalDiscount could be 0 or a negative number
  // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
  value += totalOrderDiscount

  const {
    totalWeight,
    packages,
    samedayPackageType,
  } = formatPackageAttachments(order, trackingParams)

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

  const samedayPayload: ISamedayAwbPayload = {
    awbPayment: 1,
    awbRecipient: {
      address: addressText,
      cityString: address.city,
      county: countyId,
      email: order.clientProfileData.email,
      name: address.receiverName,
      personType: 0,
      phoneNumber: order.clientProfileData.phone,
      postalCode: address.postalCode,
    },
    cashOnDelivery: payment,
    geniusOrder: 0,
    insuredValue: value,
    observation: order.orderId,
    packageType: samedayPackageType,
    packageNumber: trackingParams.numberOfPackages,
    packageWeight: totalWeight,
    parcels: packages,
    // TODO or not TODO add selectePickup function
    pickupPoint: selectedPickup,
    // TODO or not TODO selectService functions
    service: pickupServiceId,
    thirdPartyPickup: 0,
  }

  if (order.shippingData.address.addressType === pickup) {
    // samedayPayload.service = pickupServiceId
    // samedayPayload.awbRecipient.countyString = order.shippingData.address.state
    samedayPayload.awbRecipient.cityString = order.shippingData.address.city
    samedayPayload.awbRecipient.address = order.shippingData.address.street
    samedayPayload.awbRecipient.postalCode =
      order.shippingData.address.postalCode
  }

  if (order.clientProfileData.isCorporate) {
    samedayPayload.awbRecipient.personType = 1
    samedayPayload.awbRecipient.companyName =
      order.clientProfileData.corporateName
  }

  return samedayPayload
}
