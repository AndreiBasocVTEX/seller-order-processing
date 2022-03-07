import {
  shipmentPaymentMethod,
  pickup,
  defaultCountryCode,
  awbContent,
  awbSourceChannel,
  pickupServiceId,
} from './fancourier-constants.helper'
import {
  getTotalDiscount,
  getPaymentMethod,
} from '../../core/helpers/order-dto.helper'
import type { IFancourierAwbPayload } from '../dto/fancourier-awb.dto'
import type { IVtexOrder } from '../../vtex/dto/order.dto'
import type { CreateTrackingRequestParams } from '../../shared/clients/carrier-client'
import { priceMultiplier } from '../../shared/enums/constants'
import { TypeOfPayment } from '../../shared/enums/type-of-payment.enum'
import formatPackageAttachments from './fancourier-format-package-attachment.helper'
import localitiesMapper from '../../../../libs/localities-mapper'
import { isString } from '../../core/utils/type-guards'

/**
 * @TODO: Refactor in favor of requestAWB ( this method should not exist or return direct whats required for formdata )
 */
export async function createFancourierOrderPayload(
  order: IVtexOrder,
  warehouseId: string,
  trackingParams: CreateTrackingRequestParams
): Promise<IFancourierAwbPayload> {
  const totalDiscount = getTotalDiscount(order)
  const { address } = order.shippingData
  const { courierId } = order?.shippingData?.logisticsInfo?.[0].deliveryIds?.[0]

  const { county, locality } = await localitiesMapper(
    'fancourier',
    address.state,
    address.city
  )

  let value: number = order?.value

  // totalDiscount could be 0 or a negative number
  value += totalDiscount

  const typeOfPayment = getPaymentMethod(order.openTextField?.value)

  const payment =
    typeOfPayment?.toLowerCase() === TypeOfPayment.CARD
      ? 0
      : value / priceMultiplier

  const {
    numberOfParcels,
    numberOfEnvelopes,
    totalWeight,
    packages,
  } = formatPackageAttachments(order, trackingParams)

  const orderPayload: IFancourierAwbPayload = {
    service: 'Standard',
    shipmentDate: new Date().toISOString(),
    addressFrom: null,
    addressTo: {
      name: order.clientProfileData.isCorporate
        ? order.clientProfileData.corporateName
        : address.receiverName,
      contactPerson: address.receiverName,
      country: defaultCountryCode,
      countyName: isString(county),
      localityName: isString(locality),
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
      envelopeCount: numberOfEnvelopes,
      parcelsCount: numberOfParcels,
      totalWeight,
      contents: awbContent,
      parcels: packages,
    },
    externalClientLocation: warehouseId,
    externalOrderId: order.orderId,
    sourceChannel: awbSourceChannel,
    extra: {
      declaredValue: value / priceMultiplier,
      bankRepaymentAmount: payment,
    },
  }

  if (courierId) {
    orderPayload.courierId = courierId
  }

  if (order.shippingData.address.addressType === pickup) {
    orderPayload.serviceId = pickupServiceId
    orderPayload.addressTo.fixedLocationId =
      order.shippingData.address.addressId

    orderPayload.addressTo.localityId = order.shippingData.address.neighborhood
  }

  return orderPayload
}
