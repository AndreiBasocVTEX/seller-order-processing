import type { IVtexOrder, IVtexInvoiceData } from '../types/orderApi'
import {
  defaultCountryCode,
  awbContent,
  awbSourceChannel,
} from '../utils/cargusConstants'
import { constants } from '../utils/fancourierConstants'
import { getTotalWeight } from './helpers.dto'

export function createOrderPayload(
  order: IVtexOrder,
  warehouseId: string,
  invoiceData: IVtexInvoiceData
) {
  const { params: trackingParams } = invoiceData.tracking

  const totalWeight = trackingParams.weight
    ? trackingParams.weight
    : getTotalWeight(order)

  const { firstDigits } = order?.paymentData?.transactions?.[0].payments?.[0]
  const payment = firstDigits ? 0 : order.value / constants.price_multiplier
  const { address } = order.shippingData

  const numberOfParcels = trackingParams.numberOfParcels
    ? trackingParams.numberOfParcels
    : 1

  const parcels = []

  parcels.push({
    sequenceNo: 1,
    weight: totalWeight || 1,
    type: 'Parcel',
    reference1: 'Parcel 1',
    size: { width: 1, height: 1, length: 1 },
  })

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
