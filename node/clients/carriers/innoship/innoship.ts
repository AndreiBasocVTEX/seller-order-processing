import type { InstanceOptions, IOContext } from '@vtex/api'

import type {
  TrackingRequestDTO,
  IVtexOrder,
  VtexEvent,
} from '../../../types/order-api'
import type {
  IInnoshipAwbResponse,
  IInnoshipTrackAwbResponse,
} from '../../../types/innoship'
import type {
  GetAWBInfoParams,
  IBodyForRequestAwb,
  TrackingLabelParams,
} from '../../../types/carrier-client'
import { CarrierClient } from '../../../types/carrier-client'
import { createOrderPayload } from '../../../dto/sameday-order.dto'

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

  public async trackingLabel({
    settings,
    payload,
  }: TrackingLabelParams<{ awbTrackingNumber: string }>): Promise<unknown> {
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
    trackingRequest,
    order,
  }: IBodyForRequestAwb): Promise<IInnoshipAwbResponse> {
    const warehouseId = settings.innoship__warehouseId

    const body = createOrderPayload(order, warehouseId, trackingRequest)

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
    trackingRequest,
  }: {
    order: IVtexOrder
    settings: IOContext['settings']
    trackingRequest: TrackingRequestDTO
  }) {
    const awbInfo: IInnoshipAwbResponse = await this.requestAWB({
      settings,
      order,
      trackingRequest,
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
