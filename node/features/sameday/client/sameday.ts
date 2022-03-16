import type { InstanceOptions, IOContext } from '@vtex/api'

import type { VtexTrackingEvent } from '../../vtex/dto/tracking.dto'
import type {
  CreateTrackingRequest,
  DeleteTrackingRequest,
  GetTrackingLabelRequest,
  GetTrackingStatusRequest,
} from '../../shared/clients/carrier-client'
import { CarrierClient } from '../../shared/clients/carrier-client'
import type {
  ISamedayAwbResponse,
  ISamedayTrackAWBResponse,
} from '../dto/sameday-awb.dto'
import type { IAuthDataSameday } from '../models/sameday-auth.model'
import { createOrderPayload } from '../helpers/sameday-create-payload.helper'
import { CarriersEnum } from '../../shared/enums/carriers.enum'
import {
  UnhandledError,
  ValidationError,
} from '../../core/helpers/error.helper'
import findAllObjectPropsByKey from '../../core/utils/findAllObjectPropsByKey'
import type { ObjectLiteral } from '../../core/models/object-literal.model'

export default class SamedayClient extends CarrierClient {
  protected static ENABLED_SETTING_NAME = 'sameday__isEnabled'

  constructor(ctx: IOContext, options?: InstanceOptions) {
    // URL for demo environment
    super(ctx, {
      ...options,
      headers: {
        ...options?.headers,
        baseURL: 'https://sameday-api.demo.zitec.com',
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Vtex-Use-Https': 'true',
      },
    })
  }

  public isActive(settings: ObjectLiteral): boolean {
    return !!settings[SamedayClient.ENABLED_SETTING_NAME]
  }

  public throwIfDisabled(settings: ObjectLiteral): void | never {
    if (!this.isActive(settings)) {
      throw new ValidationError({
        message: `You need to enable ${CarriersEnum.SAMEDAY} integration to perform this action`,
      })
    }
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

  protected async requestAWB({
    settings,
    order,
    params,
  }: CreateTrackingRequest): Promise<ISamedayAwbResponse> {
    const { token } = await this.getAuthToken(settings)

    const body = await createOrderPayload(order, params)

    return (this.http
      .post('/api/awb', body, {
        headers: {
          'X-AUTH-TOKEN': token,
        },
      })
      .catch((error) => {
        const { data: errorData } = error?.response
        const { children } = errorData.errors

        const errorMessages = findAllObjectPropsByKey(
          children,
          'errors'
        ).map((msg) => ({ message: msg }))

        throw new UnhandledError({
          message: errorData.message,
          errors: errorMessages,
        })
      }) as unknown) as Promise<ISamedayAwbResponse>
  }

  public async trackingLabel({
    settings,
    trackingNumber,
    paperSize,
  }: GetTrackingLabelRequest): Promise<unknown> {
    const { token } = await this.getAuthToken(settings)

    return this.http
      .getStream(`/api/awb/download/${trackingNumber}/${paperSize}`, {
        headers: {
          'X-AUTH-TOKEN': token,
        },
      })
      .catch((error) => {
        throw UnhandledError.fromError(error)
      })
  }

  public async createTracking(request: CreateTrackingRequest) {
    const { awbNumber: trackingNumber } = await this.requestAWB(request)

    return {
      trackingNumber,
      trackingUrl: `https://sameday.ro/#awb=${trackingNumber}`,
      courier: CarriersEnum.SAMEDAY,
    }
  }

  public async getTrackingStatus({
    settings,
    trackingNumber,
    invoiceNumber,
  }: GetTrackingStatusRequest) {
    const { token } = await this.getAuthToken(settings)

    const updatedAwbInfo: ISamedayTrackAWBResponse = await this.http
      .get(`/api/client/awb/${trackingNumber}/status`, {
        headers: {
          'X-AUTH-TOKEN': token,
        },
      })
      .catch((error) => {
        throw UnhandledError.fromError(error)
      })

    let trackingEvents: VtexTrackingEvent[] = []
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
      isDelivered,
      events: trackingEvents,
    }
  }

  public async deleteAWB({
    settings,
    trackingNumber,
  }: DeleteTrackingRequest): Promise<boolean> {
    const { token } = await this.getAuthToken(settings)

    return this.http
      .delete(`/api/awb/${trackingNumber}`, {
        headers: {
          'X-AUTH-TOKEN': token,
        },
      })
      .then(({ status }) => status === 204)
      .catch((error) => {
        throw UnhandledError.fromError(error)
      })
  }
}
