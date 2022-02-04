import type { TrackingRequestDTO } from '../../core/dto/order-api'
import {
  getTotalWeight,
  getTotalDiscount,
} from '../../core/helpers/helpers.dto'
import { CreateTrackingRequestParams } from '../../shared/clients/carrier-client'
import type { IVtexOrder } from '../../vtex/dto/order.dto'
import type { ISamedayAwbPayload } from '../dto/sameday-awb.dto'
import {
  promissory,
  priceMultiplier,
  selectedPickup,
  pickupServiceId,
  pickup,
} from './sameday-constants.helper'

export function createOrderPayload(
  order: IVtexOrder,
  countyId: number,
  trackingParams: CreateTrackingRequestParams
): ISamedayAwbPayload {
  const totalWeight = trackingParams.weight
    ? trackingParams.weight
    : getTotalWeight(order)

  const totalOrderDiscount = getTotalDiscount(order)
  let { value } = order

  // totalDiscount could be 0 or a negative number
  // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
  value += totalOrderDiscount

  const parcels = []

  parcels.push({
    sequenceNo: 1,
    weight: totalWeight,
    type: 2,
    reference1: `Parcel 1`,
    size: { width: 1, height: 1, length: 1 },
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

  const samedayPayload = {
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
    packageType: 1,
    packageWeight: 1,
    parcels,
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

  return samedayPayload
}
