import { ExternalClient } from '@vtex/api'
import type { InstanceOptions, IOContext } from '@vtex/api'

import type { VtexAuthData } from '../types/VtexAuthData'
import type OrderApi from './orderApi'
import type {
  IAuthDataSameday,
  ISamedayAwbPayload,
  ISamedayAwbResponse,
} from '../types/sameday'
import {
  pickupServiceId,
  samedayConstants,
  selectedPickup,
} from '../utils/samedayConstants'
import type {
  Item,
  ITrackAwbInfoPayload,
  IVtexInvoiceData,
  IVtexInvoiceRequest,
  IVtexOrder,
} from '../types/orderApi'
import type { IBodyForRequestAwb } from '../types/bodyForRequestAwb'

function getTotalWeight(order: IVtexOrder) {
  return order.items.reduce((weight: number, item: Item) => {
    return weight + item.additionalInfo.dimension.weight * item.quantity
  }, 0)
}

function getTotalDiscount(order: IVtexOrder) {
  if (!order.paymentData.giftCards.length) {
    return 0
  }

  return order.paymentData.transactions[0].payments.reduce(
    (result: number, item: Item) => {
      if (item.redemptionCode) {
        result -= item.value
      }

      return result
    },
    0
  )
}

type SamedayCountyData = {
  countryId: number
  country: string
  id: number
  name: string
  code: string
}

function createOrderPayload(
  order: IVtexOrder,
  countyId: number,
  invoiceData: IVtexInvoiceData
): ISamedayAwbPayload {
  const totalWeight = invoiceData.weight
    ? invoiceData.weight
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
    order.paymentData.transactions[0].payments[0].group ===
    samedayConstants.promissory

  const payment =
    firstDigits || paymentPromissory
      ? 0
      : value / samedayConstants.price_multiplier

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

  if (order.shippingData.address.addressType === samedayConstants.pickup) {
    // samedayPayload.service = pickupServiceId
    // samedayPayload.awbRecipient.countyString = order.shippingData.address.state
    samedayPayload.awbRecipient.cityString = order.shippingData.address.city
    samedayPayload.awbRecipient.address = order.shippingData.address.street
    samedayPayload.awbRecipient.postalCode =
      order.shippingData.address.postalCode
  }

  return samedayPayload
}

export default class Sameday extends ExternalClient {
  constructor(ctx: IOContext, options?: InstanceOptions) {
    // URL for demo environment
    super('https://sameday-api.demo.zitec.com', ctx, {
      ...options,
      headers: {
        ...options?.headers,
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Vtex-Use-Https': 'true',
      },
    })
  }

  private async getAuthToken(
    settings: IOContext['settings']
  ): Promise<IAuthDataSameday> {
    return this.http.post(
      '/api/authenticate?remember_me=1',
      {},
      {
        headers: {
          'X-AUTH-PASSWORD': settings.sameday__password,
          'X-AUTH-USERNAME': settings.sameday__username,
        },
      }
    )
  }

  private async getCountyId(
    token: string,
    countyCode: string
  ): Promise<number> {
    const { data } = await this.http.get('/api/geolocation/county', {
      headers: {
        'X-AUTH-TOKEN': token,
      },
    })

    // Resolve issue with wrong countyCode
    if (countyCode === 'VN') {
      countyCode = 'VR'
    }

    const county = data.find((el: SamedayCountyData) => countyCode === el.code)

    return county.id
  }

  public async requestAwbFromSameday(
    bodyForRequestAwb: IBodyForRequestAwb
  ): Promise<ISamedayAwbResponse> {
    const { orderApi, settings, orderId, invoiceData } = bodyForRequestAwb

    const vtexAuthData: VtexAuthData = {
      vtex_appKey: settings.vtex_appKey,
      vtex_appToken: settings.vtex_appToken,
    }

    const { token } = await this.getAuthToken(settings)
    const vtexOrder: IVtexOrder = await orderApi.getVtexOrderData(
      vtexAuthData,
      orderId
    )

    const countyId = await this.getCountyId(
      token,
      vtexOrder.shippingData.address.state
    )

    const body = createOrderPayload(vtexOrder, countyId, invoiceData)

    return this.http.post('/api/awb', body, {
      headers: {
        'X-AUTH-TOKEN': token,
      },
    })
  }

  public async printAwbFromSameday(
    settings: IOContext['settings'],
    awbTrackingNumber: string
  ): Promise<unknown> {
    const { token } = await this.getAuthToken(settings)

    return this.http.getStream(`/api/awb/download/${awbTrackingNumber}/A4`, {
      headers: {
        'X-AUTH-TOKEN': token,
      },
    })
  }

  // eslint-disable-next-line max-params
  public async sendInvoiceInfoSameday(
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

    const { awbNumber: trackingNumber } = await this.requestAwbFromSameday(
      bodyForRequestAwb
    )

    const order: IVtexOrder = await orderApi.getVtexOrderData(
      vtexAuthData,
      orderId
    )

    const { items } = order

    const body: IVtexInvoiceRequest = {
      ...invoiceData,
      orderId,
      trackingNumber,
      items,
      courier: 'Sameday',
    }

    const invoiceInfo = await orderApi.sendInvoiceInfo(vtexAuthData, body)

    return {
      invoiceInfo,
      updatedItems: {
        orderId,
        trackingNumber,
        items,
        courier: body.courier,
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
  }) {
    const { token } = await this.getAuthToken(settings)
    const vtexAuthData: VtexAuthData = {
      vtex_appKey: settings.vtex_appKey,
      vtex_appToken: settings.vtex_appToken,
    }

    const order: IVtexOrder = await orderApi.getVtexOrderData(
      vtexAuthData,
      orderId
    )

    const packageItem = order?.packageAttachment?.packages?.[0]
    const trackingNumber = '1SDY6H1126947' || packageItem?.trackingNumber

    const invoiceNumber = packageItem?.invoiceNumber

    const updatedAwbInfo = await this.http.get(
      `/api/client/awb/${trackingNumber}/status`,
      {
        headers: {
          'X-AUTH-TOKEN': token,
        },
      }
    )

    const updateTrackingInfoPayload: ITrackAwbInfoPayload = {
      vtexAuthData,
      pathParams: {
        orderId,
        invoiceNumber,
      },
      payload: {
        isDelivered: false,
        deliveredDate: '',
        events: [
          {
            city: 'city',
            state: 'state',
            description: 'description',
            date: 'yyyy-mm-dd',
          },
        ],
      },
    }

    const response = await orderApi.trackAWBInfo(updateTrackingInfoPayload)

    console.log('RESPONSE', response)

    return updatedAwbInfo
  }
}
