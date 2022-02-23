import {
  getPaymentMethod,
  getTotalWeight,
} from '../../core/helpers/order-dto.helper'
import type { CreateTrackingRequestParams } from '../../shared/clients/carrier-client'
import { priceMultiplier } from '../../shared/enums/constants'
import { TypeOfPayment } from '../../shared/enums/type-of-payment.enum'
import type { IVtexOrder } from '../../vtex/dto/order.dto'
import type { InnoshipAwbPayload } from '../dto/innoship-awb.dto'
import {
  defaultCountryCode,
  awbContent,
  awbSourceChannel,
} from './innoship-constants.helper'

export function createOrderPayload(
  order: IVtexOrder,
  warehouseId: string,
  trackingParams: CreateTrackingRequestParams
): InnoshipAwbPayload {
  const totalWeight = trackingParams.weight ?? getTotalWeight(order)

  const typeOfPayment = getPaymentMethod(order.openTextField?.value)

  const payment =
    typeOfPayment?.toLowerCase() === TypeOfPayment.CARD
      ? 0
      : order.value / priceMultiplier

  const { address } = order.shippingData

  const numberOfParcels = trackingParams.numberOfParcels ?? 1

  const parcels = []

  if (numberOfParcels > 1) {
    for (let i = 1; i <= numberOfParcels; i++) {
      parcels.push({
        sequenceNo: i,
        weight: 1,
        type: 2,
        reference1: `Parcel ${i}`,
        size: { width: 1, height: 1, length: 1 },
      })
    }
  } else {
    parcels.push({
      sequenceNo: 1,
      weight: totalWeight || 1,
      type: 'Parcel',
      reference1: 'Parcel 1',
      size: { width: 1, height: 1, length: 1 },
    })
  }

  return {
    serviceId: 1,
    shipmentDate: new Date().toISOString(),
    addressFrom: null,
    addressTo: {
      name: order.clientProfileData.isCorporate
        ? order.clientProfileData.corporateName
        : address.receiverName,
      contactPerson: address.receiverName,
      country: defaultCountryCode,
      countyName: address.state,
      localityName: address.city,
      addressText: `${address.street} ${address.number} ${
        address.neighborhood || ''
      } ${address.complement || ''} ${address.reference || ''}`,
      postalCode: address.postalCode,
      phone: order.clientProfileData.phone,
      email: order.clientProfileData.email,
    },
    payment: 'Sender',
    content: {
      envelopeCount: 0,
      parcelsCount: numberOfParcels,
      palettesCount: 0,
      totalWeight,
      contents: awbContent,
      parcels,
    },
    externalClientLocation: warehouseId,
    // TODO Remove Date.now(). Needed for testing, Innoship doesn't take the same orderId twice
    externalOrderId: `${order.orderId}_${Date.now()}`,
    sourceChannel: awbSourceChannel,
    extra: {
      bankRepaymentAmount: payment,
    },
  }
}
