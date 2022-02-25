import type { IOContext } from '@vtex/api'
import { ExternalClient } from '@vtex/api'

import type { ObjectLiteral } from '../../core/models/object-literal.model'
import type { IVtexOrder } from '../../vtex/dto/order.dto'
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
  numberOfParcels?: number
}

export interface GetTrackingStatusRequest extends CarrierClientRequest {
  trackingNumber: string
  invoiceNumber: string
}

export interface GetTrackingLabelRequest extends CarrierClientRequest {
  trackingNumber: string
  paperSize: PaperSize
}

export interface TrackingStatusDTO {
  isDelivered: boolean
  deliveredDate?: string
  events?: VtexTrackingEvent[]
}

export interface TrackingInfoDTO {
  trackingNumber: string
  courier: string
  trackingUrl?: string
}

export abstract class CarrierClient extends ExternalClient {
  protected static ENABLED_SETTING_NAME: string

  protected abstract requestAWB(
    request: CreateTrackingRequest
  ): Promise<unknown>

  abstract getTrackingStatus(
    request: GetTrackingStatusRequest
  ): Promise<TrackingStatusDTO>

  abstract createTracking(
    request: CreateTrackingRequest
  ): Promise<TrackingInfoDTO>

  abstract trackingLabel(request: GetTrackingLabelRequest): unknown
  abstract isActive(settings: ObjectLiteral): boolean
  abstract throwIfDisabled(settings: ObjectLiteral): never | void
}
