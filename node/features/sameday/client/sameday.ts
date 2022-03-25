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
import { formatError } from '../../core/helpers/formatError'

export default class SamedayClient extends CarrierClient {
  protected requiredSettingsFields = [
    'sameday__isEnabled',
    'sameday__username',
    'sameday__password',
  ]

  constructor(ctx: IOContext, options?: InstanceOptions) {
    // TODO: Use this baseURL for production env: 'http://api.sameday.ro/api'; Remove from manifest policies
    super(ctx, 'http://sameday-api.demo.zitec.com/api', options)
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
      '/authenticate?remember_me=1',
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
    logger,
  }: CreateTrackingRequest): Promise<ISamedayAwbResponse> {
    const { token } = await this.getAuthToken(settings)

    logger?.info({
      function: 'Request AWB',
      carrier: 'Sameday',
      message: `Data to create payload`,
      trackingParams: params,
    })

    const body = await createOrderPayload(order, params, settings)

    logger?.info({
      function: 'RequestAWB',
      carrier: 'Sameday',
      message: `Payload to generate AWB for order with ID ${order.orderId}`,
      body,
    })

    return this.http
      .post<ISamedayAwbResponse>('/awb', body, {
        headers: {
          'X-AUTH-TOKEN': token,
        },
      })
      .catch((error) => {
        logger?.error({
          data: formatError(error),
        })

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
      })
  }

  public async trackingLabel({
    settings,
    trackingNumber,
    paperSize,
    logger,
  }: GetTrackingLabelRequest): Promise<unknown> {
    const { token } = await this.getAuthToken(settings)

    logger?.info({
      function: 'trackingLabel',
      carrier: 'sameday',
      message: `Request to create tracking label`,
      trackingNumber,
      paperSize,
    })

    return this.http
      .getStream(`/awb/download/${trackingNumber}/${paperSize}`, {
        headers: {
          'X-AUTH-TOKEN': token,
        },
      })
      .catch((error) => {
        logger?.error({
          data: formatError(error),
        })

        throw UnhandledError.fromError(error)
      })
  }

  public async createTracking(request: CreateTrackingRequest) {
    const { logger } = request

    logger?.info({
      function: 'createTracking',
      carrier: 'Sameday',
      message: 'Request to create tracking',
      request,
    })

    const { awbNumber: trackingNumber } = await this.requestAWB(request)

    logger?.info({
      function: 'createTracking',
      carrier: 'Sameday',
      message: `Sameday request AWB response`,
      trackingNumber,
    })

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
    logger,
  }: GetTrackingStatusRequest) {
    const { token } = await this.getAuthToken(settings)

    logger?.info({
      function: 'getTrackingStatus',
      carrier: 'Sameday',
      message: `Request to get tracking history`,
      trackingNumber,
      invoiceNumber,
    })

    const updatedAwbInfo: ISamedayTrackAWBResponse = await this.http
      .get(`/client/awb/${trackingNumber}/status`, {
        headers: {
          'X-AUTH-TOKEN': token,
        },
      })
      .catch((error) => {
        logger?.error({
          data: formatError(error),
        })

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

    logger?.info({
      function: 'getTrackingStatus',
      carrier: 'Sameday',
      message: `Sameday tracking events and delivery status`,
      deliveryStatus: isDelivered,
      trackingEvents,
    })

    return {
      isDelivered,
      events: trackingEvents,
    }
  }

  public async deleteAWB({
    settings,
    trackingNumber,
    logger,
  }: DeleteTrackingRequest): Promise<boolean> {
    const { token } = await this.getAuthToken(settings)

    logger?.info({
      function: 'getTrackingStatus',
      carrier: 'Sameday',
      message: `Sameday tracking number to delete AWB`,
      trackingNumber,
    })

    return this.http
      .delete(`/awb/${trackingNumber}`, {
        headers: {
          'X-AUTH-TOKEN': token,
        },
      })
      .then(({ status }) => status === 204)
      .catch((error) => {
        logger?.error({
          data: formatError(error),
        })

        throw UnhandledError.fromError(error)
      })
  }
}
