import type { InstanceOptions, IOContext } from '@vtex/api'

import type { VtexTrackingEvent } from '../../vtex/dto/tracking.dto'
import type {
  CreateTrackingRequest,
  GetTrackingStatusRequest,
  TrackingLabelParams,
} from '../../shared/clients/carrier-client'
import { CarrierClient } from '../../shared/clients/carrier-client'
import { CarriersEnum } from '../../shared/enums/carriers.enum'
import type {
  ICargusAwbResponse,
  ICargusTrackAwbResponse,
} from '../dto/cargus-awb.dto'
import { createCargusOrderPayload } from '../helpers/cargus-create-payload.helper'
import type { IAuthDataCargus } from '../models/cargus-auth.model'

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

  protected async requestAWB({ settings, order, params }: CreateTrackingRequest): Promise<ICargusAwbResponse[]> {
    const token = await this.getBearerToken(settings)

    const body = createCargusOrderPayload(
      order,
      settings.senderLocationId, // TODO: sholud be something like settings.cargus__locationId
      params,
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

  public async createTracking(request: CreateTrackingRequest) {
    const awbInfo: ICargusAwbResponse[] = await this.requestAWB(request)

    const trackingNumber = awbInfo?.[0]?.BarCode

    return {
      trackingNumber,
      courier: CarriersEnum.CARGUS,
      // TODO: Can't find tracking number
      // trackingUrl: `https://www.cargus.ro/find-shipment-romanian/?trackingReference=${trackingNumber}`,
    }
  }

  public async getTrackingStatus({ settings, trackingNumber, invoiceNumber }: GetTrackingStatusRequest) {
    const updatedAwbInfo: ICargusTrackAwbResponse[] = await this.http.get(
      `/NoAuth/GetAwbTrace?barCode=${trackingNumber}`,
      {
        headers: {
          'Ocp-Apim-Subscription-Key': settings.cargus__primaryKey,
        },
      }
    )

    let trackingEvents: VtexTrackingEvent[] | undefined
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
      isDelivered,
      events: trackingEvents,
    }
  }
}
