import type { InstanceOptions, IOContext } from '@vtex/api'

import type {
  Item,
  IVtexInvoiceData,
  IVtexOrder,
  VtexEvent,
} from '../../types/orderApi'
import {
  awbContent,
  awbSourceChannel,
  constants,
  defaultCountryCode,
} from '../../utils/fancourierConstants'
import type {
  IInnoshipAwbResponse,
  IInnoshipTrackAwbResponse,
} from '../../types/innoship'
import type {
  GetAWBInfoParams,
  IBodyForRequestAwb,
  PrintAWBParams,
} from '../../types/carrier-client'
import { CarrierClient } from '../../types/carrier-client'

function getTotalWeight(order: IVtexOrder) {
  return order.items.reduce((weight: number, item: Item) => {
    return weight + item.additionalInfo.dimension.weight * item.quantity
  }, 0)
}

function createOrderPayload(
  order: IVtexOrder,
  warehouseId: string,
  invoiceData: IVtexInvoiceData
) {
  const totalWeight = invoiceData.weight
    ? invoiceData.weight
    : getTotalWeight(order)

  const { firstDigits } = order?.paymentData?.transactions?.[0].payments?.[0]
  const payment = firstDigits ? 0 : order.value / constants.price_multiplier
  const { address } = order.shippingData

  const numberOfParcels = invoiceData.numberOfParcels
    ? invoiceData.numberOfParcels
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

export default class Innoship extends CarrierClient {
  constructor(ctx: IOContext, options?: InstanceOptions) {
    super('http://api.innoship.io/api', ctx, {
      ...options,
      headers: {
        ...options?.headers,
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Vtex-Use-Https': 'true',
      },
    })
  }

  public async printAWB({
    settings,
    payload,
  }: PrintAWBParams<{ awbTrackingNumber: string }>): Promise<unknown> {
    const [courierId, awbTrackingNumber] = payload.awbTrackingNumber.split(':')

    return this.http.get(
      `/Label/by-courier/${courierId}/awb/${awbTrackingNumber}?type=PDF&format=A4&useFile=false&api-version=1.0`,
      {
        headers: {
          accept: 'application/pdf',
          'X-Api-Key': settings.innoship__apiToken,
        },
      }
    )
  }

  protected async requestAWB({
    settings,
    invoiceData,
    order,
  }: IBodyForRequestAwb): Promise<IInnoshipAwbResponse> {
    const warehouseId = settings.innoship__warehouseId

    const body = createOrderPayload(order, warehouseId, invoiceData)

    return this.http.post('/Order?api-version=1.0', body, {
      headers: {
        'api-version': '1.0',
        'X-Api-Key': settings.innoship__apiToken,
      },
    })
  }

  public async requestAWBForInvoice({
    order,
    settings,
    invoiceData,
  }: {
    order: IVtexOrder
    settings: IOContext['settings']
    invoiceData: IVtexInvoiceData
  }) {
    const awbInfo: IInnoshipAwbResponse = await this.requestAWB({
      settings,
      order,
      invoiceData,
    })

    const {
      courierShipmentId: trackingNumber,
      trackPageUrl: trackingUrl,
      courier: courierId,
    } = awbInfo

    const { items } = order

    return {
      orderId: order.orderId,
      trackingNumber: `${courierId}:${trackingNumber}`,
      trackingUrl,
      items,
      courier: 'Innoship',
    }
  }

  public async getAWBInfo({ settings, order }: GetAWBInfoParams) {
    // @TODO: Change to the first element of an array after we will have only one packageAttachment per order
    const packageItem = order?.packageAttachment?.packages?.pop()
    const trackingInfo = packageItem?.trackingNumber

    const [courierId, trackingNumber] = trackingInfo.split(':')

    const invoiceNumber = packageItem?.invoiceNumber

    const body = {
      courier: +courierId,
      awbList: [trackingNumber],
    }

    const updatedAwbInfo: IInnoshipTrackAwbResponse[] = await this.http.post(
      '/Track/by-awb/with-return?api-version=1.0',
      body,
      {
        headers: {
          'api-version': '1.0',
          'X-Api-Key': settings.innoship__apiToken,
        },
      }
    )

    let trackingEvents: VtexEvent[] = []
    let isDelivered = false

    if (
      updatedAwbInfo.length &&
      Object.prototype.hasOwnProperty.call(updatedAwbInfo[0], 'history') &&
      invoiceNumber
    ) {
      const trackingHistory = updatedAwbInfo[0].history

      trackingEvents = trackingHistory.map((event) => {
        return {
          description: event.clientStatusDescription,
          date: event.eventDate.toString().split('T')[0],
        }
      })

      isDelivered = trackingHistory.some((event) => event.isFinalStatus)
    }

    return {
      pathParams: {
        orderId: order.orderId,
        invoiceNumber,
      },
      payload: {
        isDelivered,
        events: trackingEvents,
      },
    }
  }
}
