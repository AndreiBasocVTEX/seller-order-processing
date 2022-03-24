import type { IOContext } from '@vtex/api'

import localitiesMapper from '../../../../libs/localities-mapper'
import { getPaymentMethodFromTextField } from '../../../../libs/common-utils/object.utils'
import { getTotalDiscount } from '../../core/helpers/order-dto.helper'
import { isNumber, isString } from '../../core/utils/type-guards'
import type { CreateTrackingRequestParams } from '../../shared/clients/carrier-client'
import { priceMultiplier } from '../../shared/enums/constants'
import { TypeOfPayment } from '../../shared/enums/type-of-payment.enum'
import type { IVtexOrder } from '../../vtex/dto/order.dto'
import type { ISamedayAwbPayload } from '../dto/sameday-awb.dto'
import {
  pickup,
  defaultPickupServiceName,
  defaultSamedayPickupPoint,
} from './sameday-constants.helper'
import formatPackageAttachments from './sameday-format-package-attachment.helper'

const samedayPickupService: Record<string, number> = {
  '2H': 1,
  '3H': 2,
  '6H': 3,
  '24H': 7,
  Exclusive: 4,
}

export async function createOrderPayload(
  order: IVtexOrder,
  trackingParams: CreateTrackingRequestParams,
  settings: IOContext['settings']
): Promise<ISamedayAwbPayload> {
  const {
    sameday__pickUpServiceName: pickupService,
    sameday__pickupPoint: pickupPoint,
  } = settings

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

  const { county, locality } = await localitiesMapper(
    'sameday',
    address.state,
    address.city
  )

  const typeOfPayment = getPaymentMethodFromTextField(
    order.openTextField?.value
  )

  const payment =
    typeOfPayment?.toLowerCase() === TypeOfPayment.CARD
      ? 0
      : value / priceMultiplier

  const samedayPayload: ISamedayAwbPayload = {
    awbPayment: 1,
    awbRecipient: {
      address: addressText,
      cityString: isString(locality) ? locality : address.city,
      county: isNumber(county),
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
    pickupPoint: pickupPoint || defaultSamedayPickupPoint,
    service:
      samedayPickupService[pickupService] ||
      samedayPickupService[defaultPickupServiceName],
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
