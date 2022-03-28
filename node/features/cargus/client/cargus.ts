import type { InstanceOptions, IOContext } from '@vtex/api'

import type { VtexTrackingEvent } from '../../vtex/dto/tracking.dto'
import type {
  CreateTrackingRequest,
  DeleteTrackingRequest,
  GetTrackingLabelRequest,
  GetTrackingStatusRequest,
} from '../../shared/clients/carrier-client'
import { CarrierClient } from '../../shared/clients/carrier-client'
import { CarriersEnum } from '../../shared/enums/carriers.enum'
import type {
  ICargusAwbResponse,
  ICargusTrackAwbResponse,
} from '../dto/cargus-awb.dto'
import { createCargusOrderPayload } from '../helpers/cargus-create-payload.helper'
import type { IAuthDataCargus } from '../models/cargus-auth.model'
import { PaperSize } from '../../shared/enums/paper-size.enum'
import {
  UnhandledError,
  ValidationError,
} from '../../core/helpers/error.helper'
import type { ObjectLiteral } from '../../core/models/object-literal.model'
import { formatError } from '../../core/helpers/formatError'

export default class CargusClient extends CarrierClient {
  protected requiredSettingsFields = [
    'cargus__isEnabled',
    'cargus__username',
    'cargus__password',
    'cargus__primaryKey',
    'cargus__locationId',
    'cargus__priceTableId',
    'cargus__serviceId',
  ]

  constructor(ctx: IOContext, options?: InstanceOptions) {
    super(ctx, 'http://urgentcargus.azure-api.net/api', options)
  }

  public throwIfDisabled(settings: ObjectLiteral): void | never {
    if (!this.isActive(settings)) {
      throw new ValidationError({
        message: `You need to enable ${CarriersEnum.CARGUS} integration to perform this action`,
      })
    }
  }

  private async getBearerToken(
    settings: IOContext['settings']
  ): Promise<string> {
    const body: IAuthDataCargus = {
      UserName: settings.cargus__username,
      Password: settings.cargus__password,
    }

    return this.http
      .post<string>('/LoginUser', body, {
        headers: {
          'Ocp-Apim-Subscription-Key': settings.cargus__primaryKey,
        },
      })
      .catch((error) => {
        throw UnhandledError.fromError(error)
      })
  }

  protected async requestAWB({
    settings,
    order,
    params,
    logger,
  }: CreateTrackingRequest) {
    const token = await this.getBearerToken(settings)

    logger?.info({
      function: 'Request AWB',
      carrier: 'Cargus',
      message: `Data to create payload`,
      senderLocationId: settings.cargus__locationId,
      priceTableId: settings.cargus__priceTableId,
      trackingParams: params,
      serviceId: settings.cargus__serviceId,
    })

    const body = await createCargusOrderPayload({
      order,
      senderLocationId: settings.cargus__locationId,
      priceTableId: settings.cargus__priceTableId,
      trackingParams: params,
      serviceId: settings.cargus__serviceId,
    })

    logger?.info({
      function: 'RequestAWB',
      carrier: 'Cargus',
      message: `Payload to generate AWB for order with ID ${order.orderId}`,
      body,
    })

    return this.http
      .post<ICargusAwbResponse[]>('/Awbs/WithGetAwb', body, {
        headers: {
          'Ocp-Apim-Subscription-Key': settings.cargus__primaryKey,
          Authorization: `Bearer ${token}`,
        },
      })
      .catch((error) => {
        logger?.error({
          data: formatError(error),
        })

        throw new UnhandledError({ message: error?.response?.data.pop() })
      })
  }

  public async trackingLabel({
    settings,
    trackingNumber,
    paperSize,
    logger,
  }: GetTrackingLabelRequest): Promise<unknown> {
    const token = await this.getBearerToken(settings)

    const format = paperSize === PaperSize.A6 ? 1 : 0

    logger?.info({
      function: 'trackingLabel',
      carrier: 'Cargus',
      message: `Request to create tracking label`,
      trackingNumber,
      format,
    })

    return this.http
      .getStream(
        `/PDF/AwbDocuments?Token=${token}&barCodes=${trackingNumber}&format=${format}`,
        {
          headers: {
            'Ocp-Apim-Subscription-Key': settings.cargus__primaryKey,
          },
        }
      )
      .catch((error) => {
        logger?.error({
          data: formatError(error),
        })

        throw new UnhandledError({ message: error?.response?.data })
      })
  }

  public async createTracking(request: CreateTrackingRequest) {
    const { logger } = request

    logger?.info({
      function: 'createTracking',
      carrier: 'Cargus',
      message: `Request to create tracking`,
      request,
    })

    const awbInfo: ICargusAwbResponse[] = await this.requestAWB(request)

    logger?.info({
      function: 'createTracking',
      carrier: 'Cargus',
      message: `Cargus request AWB response`,
      awbInfo,
    })

    const trackingNumber = awbInfo?.[0]?.BarCode

    logger?.info({
      function: 'createTracking',
      carrier: 'Cargus',
      message: `Cargus AWB tracking number`,
      trackingNumber,
    })

    return {
      trackingNumber,
      courier: CarriersEnum.CARGUS,
      trackingUrl: `https://app.urgentcargus.ro/Private/Tracking.aspx?CodBara=${trackingNumber}`,
    }
  }

  public async getTrackingStatus({
    settings,
    trackingNumber,
    invoiceNumber,
    logger,
  }: GetTrackingStatusRequest) {
    const updatedAwbInfo: ICargusTrackAwbResponse[] = await this.http
      .get(`/NoAuth/GetAwbTrace?barCode=${trackingNumber}`, {
        headers: {
          'Ocp-Apim-Subscription-Key': settings.cargus__primaryKey,
        },
      })
      .catch((error) => {
        logger?.error({
          data: formatError(error),
        })

        throw UnhandledError.fromError(error)
      })

    logger?.info({
      function: 'getTrackingStatus',
      carrier: 'Cargus',
      message: `Cargus tracking history`,
      AWBHistory: updatedAwbInfo,
    })

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

    logger?.info({
      function: 'getTrackingStatus',
      carrier: 'Cargus',
      message: `Cargus tracking events and delivery status`,
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
    const token = await this.getBearerToken(settings)

    logger?.info({
      function: 'getTrackingStatus',
      carrier: 'Cargus',
      message: `Cargus tracking number to delete AWB`,
      trackingNumber,
    })

    return this.http
      .delete<boolean>(`/Awbs?barCode=${trackingNumber}`, {
        headers: {
          'Ocp-Apim-Subscription-Key': settings.cargus__primaryKey,
          Authorization: `Bearer ${token}`,
        },
      })
      .then(({ data }) => data)
      .catch((error) => {
        logger?.error({
          data: formatError(error),
        })

        throw new UnhandledError({ message: error?.response?.data })
      })
  }
}
