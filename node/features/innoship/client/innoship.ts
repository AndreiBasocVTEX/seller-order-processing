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
  IInnoshipAwbResponse,
  IInnoshipTrackAwbResponse,
} from '../dto/innoship-awb.dto'
import { createOrderPayload } from '../helpers/innoship-create-payload.helper'
import { CarriersEnum } from '../../shared/enums/carriers.enum'
import {
  UnhandledError,
  ValidationError,
} from '../../core/helpers/error.helper'
import type { ObjectLiteral } from '../../core/models/object-literal.model'
import { formatError } from '../../core/helpers/formatError'

export default class InnoshipClient extends CarrierClient {
  protected requiredSettingsFields = [
    'innoship__isEnabled',
    'innoship__apiToken',
    'innoship__warehouseId',
  ]

  constructor(ctx: IOContext, options?: InstanceOptions) {
    super(ctx, 'http://api.innoship.io/api', options)
  }

  public throwIfDisabled(settings: ObjectLiteral): void | never {
    if (!this.isActive(settings)) {
      throw new ValidationError({
        message: `You need to enable ${CarriersEnum.INNOSHIP} integration to perform this action`,
      })
    }
  }

  public async trackingLabel({
    settings,
    trackingNumber,
    paperSize,
    logger,
  }: GetTrackingLabelRequest): Promise<unknown> {
    logger?.info({
      function: 'trackingLabel',
      carrier: 'Innoship',
      message: `Request to create tracking label`,
      trackingNumber,
      paperSize,
    })

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
      .catch((error) => {
        logger?.error({
          data: formatError(error),
        })

        throw UnhandledError.fromError(error)
      })
  }

  protected async requestAWB({
    settings,
    order,
    params,
    logger,
  }: CreateTrackingRequest) {
    const warehouseId = settings.innoship__warehouseId

    logger?.info({
      function: 'Request AWB',
      carrier: 'Innoship',
      message: `Data to create payload`,
      warehouseId,
      trackingParams: params,
    })

    const body = await createOrderPayload(order, warehouseId, params)

    logger?.info({
      function: 'RequestAWB',
      carrier: 'Innoship',
      message: `Payload to generate AWB for order with ID ${order.orderId}`,
      body,
    })

    return this.http
      .post<IInnoshipAwbResponse>('/Order?api-version=1.0', body, {
        headers: {
          'api-version': '1.0',
          'X-Api-Key': settings.innoship__apiToken,
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
      carrier: 'Innoship',
      message: `Request to create tracking`,
      request,
    })

    const awbInfo: IInnoshipAwbResponse = await this.requestAWB(request)

    logger?.info({
      function: 'createTracking',
      carrier: 'Innoship',
      message: `Innoship request AWB response`,
      awbInfo,
    })

    const {
      courierShipmentId: trackingNumber,
      trackPageUrl: trackingUrl,
      courier: courierId,
    } = awbInfo

    logger?.info({
      function: 'createTracking',
      carrier: 'Innoship',
      message: `Innoship AWB tracking number`,
      trackingNumber,
      trackingUrl,
      courierId,
    })

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
    logger,
  }: GetTrackingStatusRequest) {
    logger?.info({
      function: 'getTrackingStatus',
      carrier: 'Innoship',
      message: `Request to get tracking history`,
      trackingInfo,
      invoiceNumber,
    })

    const [courierId, trackingNumber] = trackingInfo.split(':')

    const body = {
      courier: +courierId,
      awbList: [trackingNumber],
    }

    logger?.info({
      function: 'getTrackingStatus',
      carrier: 'Innoship',
      message: `Data to Innoship`,
      courier: +courierId,
      awbList: [trackingNumber],
    })

    const updatedAwbInfo = await this.http
      .post<IInnoshipTrackAwbResponse[]>(
        '/Track/by-awb/with-return?api-version=1.0',
        body,
        {
          headers: {
            'api-version': '1.0',
            'X-Api-Key': settings.innoship__apiToken,
          },
        }
      )
      .catch((error) => {
        logger?.error({
          data: formatError(error),
        })

        throw UnhandledError.fromError(error)
      })

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

    logger?.info({
      function: 'getTrackingStatus',
      carrier: 'Innoship',
      message: `Innoship tracking events and delivery status`,
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
  }: DeleteTrackingRequest) {
    const [courierId, awbTrackingNumber] = trackingNumber.split(':')

    logger?.info({
      function: 'getTrackingStatus',
      carrier: 'Innoship',
      message: `Innoship tracking number to delete AWB`,
      courierId,
      awbTrackingNumber,
    })

    return this.http
      .delete<boolean>(`api/Order/${courierId}/awb/${awbTrackingNumber}`, {
        headers: {
          'api-version': '1.0',
          'X-Api-Key': settings.innoship__apiToken,
        },
      })
      .then(({ data }) => data)
      .catch((error) => {
        logger?.error({
          data: formatError(error),
        })

        throw UnhandledError.fromError(error)
      })
  }
}
