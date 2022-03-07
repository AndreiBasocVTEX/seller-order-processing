import localitiesMapper from '../../../../libs/localities-mapper'
import { getPaymentMethod } from '../../core/helpers/order-dto.helper'
import { isString } from '../../core/utils/type-guards'
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
import formatPackageAttachments from './innoship-format-package-attachment.helper'

export async function createOrderPayload(
  order: IVtexOrder,
  warehouseId: string,
  trackingParams: CreateTrackingRequestParams
): Promise<InnoshipAwbPayload> {
  const typeOfPayment = getPaymentMethod(order.openTextField?.value)

  const payment =
    typeOfPayment?.toLowerCase() === TypeOfPayment.CARD
      ? 0
      : order.value / priceMultiplier

  const { address } = order.shippingData

  const { county, locality } = await localitiesMapper(
    'innoship',
    address.state,
    address.city
  )

  const {
    packages,
    totalWeight,
    numberOfEnvelopes,
    numberOfParcels,
  } = formatPackageAttachments(order, trackingParams)

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
      countyName: isString(county),
      localityName: isString(locality),
      addressText: `${address.street} ${address.number} ${
        address.neighborhood || ''
      } ${address.complement || ''} ${address.reference || ''}`,
      postalCode: address.postalCode,
      phone: order.clientProfileData.phone,
      email: order.clientProfileData.email,
    },
    payment: 'Sender',
    content: {
      envelopeCount: numberOfEnvelopes,
      parcelsCount: numberOfParcels,
      palettesCount: 0,
      totalWeight,
      contents: awbContent,
      parcels: packages,
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
