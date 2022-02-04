import type { InstanceOptions, IOContext } from '@vtex/api'

import type {
  TrackingRequestDTO,
  IVtexOrder,
  VtexEvent,
} from '../../../types/order-api'
import type {
  GetAWBInfoParams,
  IBodyForRequestAwb,
  TrackingLabelParams,
} from '../../../types/carrier-client'
import { CarrierClient } from '../../../types/carrier-client'
import { CarriersEnum } from '../../../core/enums/carriers.enum'
import type {
  IAuthDataCargus,
  ICargusAwbResponse,
  ICargusTrackAwbResponse,
} from '../dto/cargus-awb.dto'
import { createCargusOrderPayload } from '../helpers/create-payload.helper'

export default class CargusClient extends CarrierClient {
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
    trackingRequest,
    order,
  }: IBodyForRequestAwb): Promise<ICargusAwbResponse[]> {
    const token = await this.getBearerToken(settings)

    const body = createCargusOrderPayload(
      order,
      settings.senderLocationId, // TODO: sholud be something like settings.cargus__locationId
      trackingRequest
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
    trackingRequest,
  }: {
    order: IVtexOrder
    settings: IOContext['settings']
    trackingRequest: TrackingRequestDTO
  }) {
    const awbInfo: ICargusAwbResponse[] = await this.requestAWB({
      order,
      settings,
      trackingRequest,
    })

    const trackingNumber = awbInfo?.[0]?.BarCode

    return {
      trackingNumber,
      courier: CarriersEnum.CARGUS,
      // TODO: Can't find tracking number
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
