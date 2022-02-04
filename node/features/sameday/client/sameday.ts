import type { InstanceOptions, IOContext } from '@vtex/api'

import type {
  TrackingRequestDTO,
  IVtexOrder,
  VtexEvent,
} from '../../../types/order-api'
import { CarrierClient } from '../../../types/carrier-client'
import type {
  GetAWBInfoParams,
  IBodyForRequestAwb,
  TrackingLabelParams,
} from '../../../types/carrier-client'
import type {
  ISamedayCountyData,
  ISamedayAwbResponse,
  ISamedayTrackAWBResponse,
} from '../dto/sameday-awb.dto'
import type { IAuthDataSameday } from '../models/sameday-auth.model'
import { createOrderPayload } from '../helpers/sameday-create-payload.helper'

export default class SamedayClient extends CarrierClient {
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

    const county = data.find((el: ISamedayCountyData) => countyCode === el.code)

    return county.id
  }

  protected async requestAWB({
    settings,
    trackingRequest,
    order,
  }: IBodyForRequestAwb): Promise<ISamedayAwbResponse> {
    const { token } = await this.getAuthToken(settings)
    const countyId = await this.getCountyId(
      token,
      order.shippingData.address.state
    )

    const body = createOrderPayload(order, countyId, trackingRequest)

    return this.http.post('/api/awb', body, {
      headers: {
        'X-AUTH-TOKEN': token,
      },
    })
  }

  public async trackingLabel({
    settings,
    payload,
  }: TrackingLabelParams<{ awbTrackingNumber: string }>): Promise<unknown> {
    const { token } = await this.getAuthToken(settings)

    return this.http.getStream(
      `/api/awb/download/${payload.awbTrackingNumber}/A4`,
      {
        headers: {
          'X-AUTH-TOKEN': token,
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
    const { awbNumber: trackingNumber } = await this.requestAWB({
      settings,
      order,
      trackingRequest,
    })

    const { items } = order

    return {
      orderId: order.orderId,
      trackingNumber,
      items,
      courier: 'Sameday',
    }
  }

  public async getAWBInfo({ settings, order }: GetAWBInfoParams) {
    const { token } = await this.getAuthToken(settings)

    // @TODO: Change to the first element of an array after we will have only one packageAttachment per order
    const packageItem = order?.packageAttachment?.packages?.pop()
    const trackingNumber = packageItem?.trackingNumber

    const invoiceNumber = packageItem?.invoiceNumber

    const updatedAwbInfo: ISamedayTrackAWBResponse = await this.http.get(
      `/api/client/awb/${trackingNumber}/status`,
      {
        headers: {
          'X-AUTH-TOKEN': token,
        },
      }
    )

    let trackingEvents: VtexEvent[] = []
    let isDelivered = false

    if (
      updatedAwbInfo?.hasOwnProperty.call(
        updatedAwbInfo,
        'expeditionHistory'
      ) &&
      invoiceNumber
    ) {
      const {
        expeditionHistory: trackingHistory,
        expeditionSummary,
      } = updatedAwbInfo

      trackingEvents = trackingHistory.map((event) => {
        return {
          description: event.statusState,
          date: event.statusDate.split('T')[0],
        }
      })

      isDelivered = expeditionSummary.delivered
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
