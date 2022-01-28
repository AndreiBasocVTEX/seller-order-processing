import { ExternalClient } from '@vtex/api'
import type { InstanceOptions, IOContext } from '@vtex/api'

import type OrderApi from './orderApi'
import type { VtexAuthData } from '../types/VtexAuthData'
import type {
  Item,
  ITrackAwbInfoPayload,
  ITrackAwbInfoResponse,
  IVtexInvoiceData,
  IVtexInvoiceRequest,
  IVtexOrder,
  VtexEvent,
} from '../types/orderApi'
import {
  awbContent,
  awbSourceChannel,
  constants,
  defaultCountryCode,
} from '../utils/fancourierConstants'
import type {
  IInnoshipAwbResponse,
  IInnoshipTrackAwbResponse,
} from '../types/innoship'
import type { IBodyForRequestAwb } from '../types/bodyForRequestAwb'

function getTotalWeight(order: IVtexOrder) {
  return order.items.reduce((weight: number, item: Item) => {
    return weight + item.additionalInfo.dimension.weight * item.quantity
  }, 0)
}

function createOrderPayload(order: IVtexOrder, invoiceData: IVtexInvoiceData) {
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
  const innoshipPayload = {
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
    externalClientLocation: 'RO',
    // TODO Remove Date.now(). Needed for testing, Innoship doesn't take the same orderId twice
    externalOrderId: `${order.orderId}_${Date.now()}`,
    sourceChannel: awbSourceChannel,
    extra: {
      bankRepaymentAmount: payment,
    },
  }

  return innoshipPayload
}

export default class Innoship extends ExternalClient {
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

  public async printAwbFromInnoship(
    settings: IOContext['settings'],
    data: string
  ) {
    const [courierId, awbTrackingNumber] = data.split(':')

    const response = this.http.get(
      `/Label/by-courier/${courierId}/awb/${awbTrackingNumber}?type=PDF&format=A4&useFile=false&api-version=1.0`,
      {
        headers: {
          accept: 'application/pdf',
          'X-Api-Key': settings.innoship__apiToken,
        },
      }
    )

    return response
  }

  private async requestAwbFromInnoship(
    bodyForRequestAwb: IBodyForRequestAwb
  ): Promise<IInnoshipAwbResponse> {
    const { orderApi, settings, orderId, invoiceData } = bodyForRequestAwb
    const vtexAuthData: VtexAuthData = {
      vtex_appKey: settings.vtex_appKey,
      vtex_appToken: settings.vtex_appToken,
    }

    const vtexOrder = await orderApi.getVtexOrderData(vtexAuthData, orderId)

    const body = createOrderPayload(vtexOrder, invoiceData)

    return this.http.post('/Order?api-version=1.0', body, {
      headers: {
        'api-version': '1.0',
        'X-Api-Key': settings.innoship__apiToken,
      },
    })
  }

  // eslint-disable-next-line max-params
  public async sendInvoiceInfoInnoship(
    orderApi: OrderApi,
    settings: IOContext['settings'],
    orderId: string,
    invoiceData: IVtexInvoiceData
  ) {
    const vtexAuthData: VtexAuthData = {
      vtex_appKey: settings.vtex_appKey,
      vtex_appToken: settings.vtex_appToken,
    }

    const bodyForRequestAwb = {
      orderApi,
      settings,
      orderId,
      invoiceData,
    }

    const awbInfo: IInnoshipAwbResponse = await this.requestAwbFromInnoship(
      bodyForRequestAwb
    )

    const {
      courierShipmentId: trackingNumber,
      trackPageUrl: trackingUrl,
      courier: courierId,
    } = awbInfo

    const order: IVtexOrder = await orderApi.getVtexOrderData(
      vtexAuthData,
      orderId
    )

    const { items } = order

    const body: IVtexInvoiceRequest = {
      ...invoiceData,
      orderId,
      trackingNumber: `${courierId}:${trackingNumber}`,
      trackingUrl,
      items,
      courier: 'Innoship',
    }

    const invoiceInfo = await orderApi.sendInvoiceInfo(vtexAuthData, body)

    return {
      invoiceInfo,
      updatedItems: {
        orderId,
        trackingNumber: `${courierId}:${trackingNumber}`,
        items,
        courier: body.courier,
        trackingUrl,
      },
    }
  }

  public async getAWBInfo({
    settings,
    orderApi,
    orderId,
  }: {
    settings: IOContext['settings']
    orderApi: OrderApi
    orderId: string
  }): Promise<ITrackAwbInfoResponse> {
    const vtexAuthData: VtexAuthData = {
      vtex_appKey: settings.vtex_appKey,
      vtex_appToken: settings.vtex_appToken,
    }

    const order: IVtexOrder = await orderApi.getVtexOrderData(
      vtexAuthData,
      orderId
    )

    // TODO Change to the first element of an array after we will have only one packageAttachment per order
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

    const updateTrackingInfoPayload: ITrackAwbInfoPayload = {
      vtexAuthData,
      pathParams: {
        orderId,
        invoiceNumber,
      },
      payload: {
        isDelivered,
        events: trackingEvents,
      },
    }

    return orderApi.trackAWBInfo(updateTrackingInfoPayload)
  }
}
