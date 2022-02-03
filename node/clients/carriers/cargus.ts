import type { InstanceOptions, IOContext } from '@vtex/api'

import type {
  IAuthDataCargus,
  ICargusAwbPayload,
  ICargusAwbResponse,
  ICargusTrackAwbResponse,
} from '../../types/cargus'
import type {
  Item,
  IVtexInvoiceData,
  IVtexOrder,
  VtexEvent,
} from '../../types/orderApi'
import {
  cargusConstants,
  defaultEnvelopeCount,
  shipmentPaymentMethod,
} from '../../utils/cargusConstants'
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

function createOrderPayload(
  order: IVtexOrder,
  senderLocationId: string,
  invoiceData: IVtexInvoiceData
): ICargusAwbPayload {
  // The selected service does not allow parts weighing more than 31 kg
  const totalWeight = invoiceData.weight
    ? invoiceData.weight
    : getTotalWeight(order)

  const totalOrderDiscount = getTotalDiscount(order)
  let { value } = order

  // totalDiscount could be 0 or a negative number
  // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
  value += totalOrderDiscount

  const numberOfParcels = invoiceData.numberOfParcels
    ? invoiceData.numberOfParcels
    : 1

  const parcels = []

  parcels.push({
    Weight: totalWeight,
    Type: 1,
    Code: 'Parcel 1',
    Length: 10,
    Width: 10,
    Height: 10,
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
    cargusConstants.promissory

  const payment =
    firstDigits || paymentPromissory
      ? 0
      : value / cargusConstants.price_multiplier

  let county = ''
  let locality = ''

  if (
    address.state === 'Bucureşti' ||
    address.state === 'BUCUREŞTI' ||
    address.state === 'B'
  ) {
    county = 'Bucuresti'
    locality = 'Bucuresti'
  } else {
    county = address.state
    locality = address.city
  }

  return {
    DeliveryPudoPoint: null,
    SenderClientId: null,
    TertiaryClientId: null,
    TertiaryLocationId: null,
    Sender: {
      LocationId: senderLocationId || null,
    },
    Recipient: {
      Name: address.receiverName,
      ContactPerson: address.receiverName,
      CountyName: county,
      LocalityName: locality,
      AddressText: addressText,
      PostalCode: address.postalCode,
      PhoneNumber: order.clientProfileData.phone,
      Email: order.clientProfileData.email,
    },
    Parcels: numberOfParcels,
    ServiceId: null,
    Envelopes: defaultEnvelopeCount,
    TotalWeight: totalWeight,
    ShipmentPayer: shipmentPaymentMethod,
    CashRepayment: payment,
    CustomString: order.orderId,
    ParcelCodes: parcels,
  }
}

export default class Cargus extends CarrierClient {
  constructor(ctx: IOContext, options?: InstanceOptions) {
    super('http://urgentcargus.azure-api.net/api', ctx, {
      ...options,
      headers: {
        ...options?.headers,
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Vtex-Use-Https': 'true',
      },
    })
  }

  private async getBearerToken(
    settings: IOContext['settings']
  ): Promise<string> {
    const body: IAuthDataCargus = {
      UserName: settings.cargus__username,
      Password: settings.cargus__password,
    }

    return this.http.post('/LoginUser', body, {
      headers: {
        'Ocp-Apim-Subscription-Key': settings.cargus__primaryKey,
      },
    })
  }

  protected async requestAWB({
    settings,
    invoiceData,
    order,
  }: IBodyForRequestAwb): Promise<ICargusAwbResponse[]> {
    const token = await this.getBearerToken(settings)
    const body = createOrderPayload(
      order,
      settings.senderLocationId,
      invoiceData
    )

    return this.http.post('/Awbs/WithGetAwb', body, {
      headers: {
        'Ocp-Apim-Subscription-Key': settings.cargus__primaryKey,
        Authorization: `Bearer ${token}`,
      },
    })
  }

  public async printAWB({
    settings,
    payload,
  }: PrintAWBParams<{ awbTrackingNumber: string }>): Promise<unknown> {
    const token = await this.getBearerToken(settings)

    return this.http.getStream(
      `/PDF/AwbDocuments?Token=${token}&barCodes=${payload.awbTrackingNumber}&format=0`,
      {
        headers: {
          'Ocp-Apim-Subscription-Key': settings.cargus__primaryKey,
        },
      }
    )
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
    const awbInfo: ICargusAwbResponse[] = await this.requestAWB({
      order,
      settings,
      invoiceData,
    })

    const { items } = order
    const trackingNumber = awbInfo?.[0]?.BarCode

    return {
      orderId: order.orderId,
      trackingNumber,
      items,
      courier: 'Cargus',
      // Can't find tracking number
      // trackingUrl: `https://www.cargus.ro/find-shipment-romanian/?trackingReference=${trackingNumber}`,
    }
  }

  public async getAWBInfo({ settings, order }: GetAWBInfoParams) {
    // @TODO: Change to the first element of an array after we will have only one packageAttachment per order
    const packageItem = order?.packageAttachment?.packages?.pop()
    const trackingNumber = packageItem?.trackingNumber
    const invoiceNumber = packageItem?.invoiceNumber

    const updatedAwbInfo: ICargusTrackAwbResponse[] = await this.http.get(
      `/NoAuth/GetAwbTrace?barCode=${trackingNumber}`,
      {
        headers: {
          'Ocp-Apim-Subscription-Key': settings.cargus__primaryKey,
        },
      }
    )

    let trackingEvents: VtexEvent[] | undefined
    let isDelivered = false

    if (
      updatedAwbInfo.length &&
      Object.prototype.hasOwnProperty.call(updatedAwbInfo[0], 'Event') &&
      invoiceNumber
    ) {
      const trackingHistory: ICargusTrackAwbResponse['Event'] =
        updatedAwbInfo?.[0].Event

      trackingEvents = trackingHistory.map((event) => {
        return {
          description: event.Description,
          date: event.Date,
          city: event.LocalityName,
        }
      })

      // Cargus. EventId 21 === Delivered
      isDelivered = trackingHistory.some((event) => event.EventId === 21)
    }

    return {
      pathParams: {
        orderId: order.orderId,
        invoiceNumber,
      },
      payload: {
        isDelivered,
        // We are unable to update events field therefore we are not sending empty array
        events: trackingEvents,
      },
    }
  }
}
