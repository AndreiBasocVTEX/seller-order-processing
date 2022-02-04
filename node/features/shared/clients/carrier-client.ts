import type { IOContext } from '@vtex/api'
import { ExternalClient } from '@vtex/api'

import type { TrackingRequestDTO, IVtexOrder, VtexEvent } from '../../core/dto/order-api'

export interface ITrackAwbInfoPayload {
  pathParams: {
    orderId: string
    invoiceNumber: string
  }
  payload: {
    isDelivered: boolean
    deliveredDate?: string
    events?: VtexEvent[]
  }
}

export type GetAWBInfoParams = {
  settings: IOContext['settings']
  order: IVtexOrder
}

export interface TrackingInfoDTO {
  trackingNumber: string
  courier: string
  trackingUrl?: string
}
export interface IBodyForRequestAwb {
  order: IVtexOrder
  settings: IOContext['settings']
  trackingRequest: TrackingRequestDTO
}

export interface TrackingLabelParams<PayloadType = { [key: string]: unknown }> {
  settings: IOContext['settings']
  payload: PayloadType
}

export abstract class CarrierClient extends ExternalClient {
  protected abstract requestAWB({
    settings,
    trackingRequest,
    order,
  }: IBodyForRequestAwb): Promise<unknown>

  abstract getAWBInfo({
    settings,
    order,
  }: GetAWBInfoParams): Promise<ITrackAwbInfoPayload>

  abstract requestAWBForInvoice({
    order,
    settings,
    trackingRequest,
  }: {
    order: IVtexOrder
    settings: IOContext['settings']
    trackingRequest: TrackingRequestDTO
  }): Promise<TrackingInfoDTO>

  abstract trackingLabel({ settings, payload }: TrackingLabelParams): unknown
}
