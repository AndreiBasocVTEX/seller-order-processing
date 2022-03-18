import type { IOContext, InstanceOptions } from '@vtex/api'
import { ExternalClient } from '@vtex/api'

import type { ObjectLiteral } from '../../core/models/object-literal.model'
import type { IVtexOrder } from '../../vtex/dto/order.dto'
import type { TrackingInfoDTO } from '../../vtex/dto/track-and-invoice.dto'
import type { VtexTrackingEvent } from '../../vtex/dto/tracking.dto'
import type { PaperSize } from '../enums/paper-size.enum'

interface CarrierClientRequest {
  settings: IOContext['settings']
}

export interface CreateTrackingRequest extends CarrierClientRequest {
  order: IVtexOrder
  params: CreateTrackingRequestParams
}

export interface CreateTrackingRequestParams {
  weight?: number
  numberOfPackages: number
  packageType: 'envelope' | 'parcel'
}

export interface GetTrackingStatusRequest extends CarrierClientRequest {
  trackingNumber: string
  invoiceNumber: string
}

export interface GetTrackingLabelRequest extends CarrierClientRequest {
  trackingNumber: string
  paperSize: PaperSize
}

export interface DeleteTrackingRequest extends CarrierClientRequest {
  trackingNumber: string
}

interface TrackingStatusDTO {
  isDelivered: boolean
  deliveredDate?: string
  events?: VtexTrackingEvent[]
}

export abstract class CarrierClient extends ExternalClient {
  protected requiredSettingsFields: string[] = []

  constructor(ctx: IOContext, baseURL: string, options?: InstanceOptions) {
    super(baseURL, ctx, {
      ...options,
      headers: {
        ...options?.headers,
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Vtex-Use-Https': 'true',
      },
    })
  }

  protected abstract requestAWB(
    request: CreateTrackingRequest
  ): Promise<unknown>

  abstract getTrackingStatus(
    request: GetTrackingStatusRequest
  ): Promise<TrackingStatusDTO>

  abstract createTracking(
    request: CreateTrackingRequest
  ): Promise<TrackingInfoDTO>

  abstract deleteAWB(request: DeleteTrackingRequest): Promise<boolean>

  abstract trackingLabel(request: GetTrackingLabelRequest): unknown

  public isActive(settings: ObjectLiteral): boolean {
    return this.requiredSettingsFields.every((field) => {
      return settings[field]
    })
  }

  abstract throwIfDisabled(settings: ObjectLiteral): never | void
}
