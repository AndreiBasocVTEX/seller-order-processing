import {
  awbContent,
  awbSourceChannel,
  defaultCountryCode,
  defaultEnvelopeCount,
  shipmentPaymentMethod,
  totalOrderDiscount,
  priceMultiplier,
  promissory,
} from './utils/constants'

export const initialState = {
  availableServices: [],
  selectedService: 'Standard',
  order: {},
  fancourierPayload: {},
}

const createOrderPayloadForFancourier = (state: any): any => {
  const order = state.order
  let trackingNumber
  let orderWeight = 0
  let { value }: { value: number } = order
  const { address } = order.shippingData
  const { warehouseId } = order.shippingData.logisticsInfo[0].deliveryIds[0]
  const { firstDigits } = order.paymentData.transactions[0].payments[0]
  const { courierId } = order.shippingData.logisticsInfo[0].deliveryIds[0]

  if (order.packageAttachment.packages.length) {
    const packageItem = order.packageAttachment.packages[0]

    trackingNumber = packageItem.trackingNumber
  }

  if (!trackingNumber && order.status === 'invoiced') {
    orderWeight = order.items.reduce((result: number, item: any): any => {
      result += (item.additionalInfo.dimension.weight * item.quantity) as number

      return result
    }, 0)
  }

  value += totalOrderDiscount

  const paymentPromissory =
    order.paymentData.transactions[0].payments[0].group === promissory

  const payment = firstDigits || paymentPromissory ? 0 : value / priceMultiplier

  const payload: any = {
    service: state.selectedService,
    shipmentDate: new Date().toISOString(),
    addressFrom: null,
    addressTo: {
      name: address.receiverName,
      contactPerson: address.receiverName,
      country: defaultCountryCode,
      countyName: address.state,
      localityName: address.city,
      street: address.street,
      number: address.number,
      neighborhood: address.neighborhood,
      complement: address.complement,
      reference: address.reference,
      postalCode: address.postalCode,
      phone: order.clientProfileData.phone,
      email: order.clientProfileData.email,
    },
    payment: shipmentPaymentMethod,
    value,
    content: {
      envelopeCount: defaultEnvelopeCount,
      parcelsCount: 1,
      totalWeight: orderWeight,
      contents: awbContent,
      parcels: [
        {
          sequenceNo: 1,
          weight: 0,
          type: 2,
          reference1: 'Parcel 1',
          size: {
            width: 1,
            height: 1,
            length: 1,
          },
        },
      ],
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
    payload.courierId = courierId
  }

  return payload
}

export const fancourierReducer = (state: any, action: any) => {
  switch (action.type) {
    case 'getServices':
      return { ...state, availableServices: action.payload }

    case 'getVtexOrderData':
      return { ...state, order: action.payload }

    case 'selectService':
      return { ...state, selectedService: action.payload }

    case 'fancourierPayload': {
      const fancourierPayload = createOrderPayloadForFancourier(state)

      return { ...state, fancourierPayload }
    }

    default:
      throw new Error()
  }
}
