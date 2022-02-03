import type { InstanceOptions, IOContext } from '@vtex/api'

import type {
  IAuthDataCargus,
  ICargusAwbResponse,
  ICargusTrackAwbResponse,
} from '../../types/cargus'
import type {
  IVtexInvoiceData,
  IVtexOrder,
  VtexEvent,
} from '../../types/orderApi'
import type {
  GetAWBInfoParams,
  IBodyForRequestAwb,
  TrackingLabelParams,
} from '../../types/carrier-client'
import { CarrierClient } from '../../types/carrier-client'
import { createCargusOrderPayload } from '../../dto/cargus-order.dto'

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

    const body = createCargusOrderPayload(
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

  public async trackingLabel({
    settings,
    payload,
  }: TrackingLabelParams<{ awbTrackingNumber: string }>): Promise<unknown> {
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
