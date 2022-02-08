import { getTotalWeight } from '../../core/helpers/helpers.dto'
import type { CreateTrackingRequestParams } from '../../shared/clients/carrier-client'
import type { IVtexOrder } from '../../vtex/dto/order.dto'
import {
  defaultCountryCode,
  awbContent,
  awbSourceChannel,
  priceMultiplier,
} from './innoship-constants.helper'

export function createOrderPayload(
  order: IVtexOrder,
  warehouseId: string,
  trackingParams: CreateTrackingRequestParams
) {
  const totalWeight = trackingParams.weight ?? getTotalWeight(order)

  const { firstDigits } = order?.paymentData?.transactions?.[0].payments?.[0]
  const payment = firstDigits ? 0 : order.value / priceMultiplier
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

  // TODO interface for InnoshipPayload
  return {
    serviceId: 1,
    shipmentDate: new Date().toISOString(),
    addressFrom: null,
    addressTo: {
      name: address.receiverName,
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
