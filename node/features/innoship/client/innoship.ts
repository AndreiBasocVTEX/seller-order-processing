import type { InstanceOptions, IOContext } from '@vtex/api'

import type { VtexTrackingEvent } from '../../vtex/dto/tracking.dto'
import type {
  CreateTrackingRequest,
  GetTrackingLabelRequest,
  GetTrackingStatusRequest,
} from '../../shared/clients/carrier-client'
import { CarrierClient } from '../../shared/clients/carrier-client'
import type {
  IInnoshipAwbResponse,
  IInnoshipTrackAwbResponse,
} from '../dto/innoship-awb.dto'
import { createOrderPayload } from '../helpers/innoship-create-payload.helper'
import { CarriersEnum } from '../../shared/enums/carriers.enum'

export default class InnoshipClient extends CarrierClient {
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

  public async trackingLabel({
    settings,
    trackingNumber,
    paperSize,
  }: GetTrackingLabelRequest): Promise<unknown> {
    const [courierId, awbTrackingNumber] = trackingNumber.split(':')

    return this.http
      .get(
        `/Label/by-courier/${courierId}/awb/${awbTrackingNumber}?type=PDF&format=${paperSize}&useFile=false&api-version=1.0`,
        {
          headers: {
            accept: 'application/pdf',
            'X-Api-Key': settings.innoship__apiToken,
          },
        }
      )
      .then((data) => {
        return Buffer.from(data.contents, 'base64')
      })
  }

  protected async requestAWB({
    settings,
    order,
    params,
  }: CreateTrackingRequest): Promise<IInnoshipAwbResponse> {
    const warehouseId = settings.innoship__warehouseId

    const body = createOrderPayload(order, warehouseId, params)

    return this.http.post('/Order?api-version=1.0', body, {
      headers: {
        'api-version': '1.0',
        'X-Api-Key': settings.innoship__apiToken,
      },
    })
  }

  public async createTracking(request: CreateTrackingRequest) {
    const awbInfo: IInnoshipAwbResponse = await this.requestAWB(request)

    const {
      courierShipmentId: trackingNumber,
      trackPageUrl: trackingUrl,
      courier: courierId,
    } = awbInfo

    return {
      trackingNumber: `${courierId}:${trackingNumber}`,
      trackingUrl,
      courier: CarriersEnum.INNOSHIP,
    }
  }

  public async getTrackingStatus({
    settings,
    trackingNumber: trackingInfo,
    invoiceNumber,
  }: GetTrackingStatusRequest) {
    // @TODO: Change to the first element of an array after we will have only one packageAttachment per order

    const [courierId, trackingNumber] = trackingInfo.split(':')

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

    let trackingEvents: VtexTrackingEvent[] = []
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
      isDelivered,
      events: trackingEvents,
    }
  }
}
