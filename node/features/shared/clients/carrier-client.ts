import type { IOContext } from '@vtex/api'
import { ExternalClient } from '@vtex/api'

import type { IVtexOrder } from '../../vtex/dto/order.dto'
import type { VtexTrackingEvent } from '../../vtex/dto/tracking.dto'

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

export interface TrackingStatusDTO {
  isDelivered: boolean
  deliveredDate?: string
  events?: VtexTrackingEvent[]
}

export interface GetTrackingStatusRequest extends CarrierClientRequest {
  trackingNumber: string
  invoiceNumber: string
}

export interface TrackingInfoDTO {
  trackingNumber: string
  courier: string
  trackingUrl?: string
}

export interface TrackingLabelParams<PayloadType = { [key: string]: unknown }> {
  settings: IOContext['settings']
  payload: PayloadType
}

export abstract class CarrierClient extends ExternalClient {

  protected abstract requestAWB(request: CreateTrackingRequest): Promise<unknown>

  abstract getTrackingStatus(request: GetTrackingStatusRequest): Promise<TrackingStatusDTO>

  abstract createTracking(request: CreateTrackingRequest): Promise<TrackingInfoDTO>

  abstract trackingLabel({ settings, payload }: TrackingLabelParams): unknown
}
