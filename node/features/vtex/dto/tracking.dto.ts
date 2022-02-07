import type { OrderAwareVtexRequest } from './common.dto'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface UpdateTrackingStatusRequestDTO
  extends OrderAwareVtexRequest<UpdateTrackingStatusPayload> {}

export interface UpdateTrackingStatusPayload {
  isDelivered: boolean
  deliveredDate?: string
  events?: VtexTrackingEvent[]
}
export interface VtexTrackingEvent {
  city?: string
  state?: string
  description?: string
  date?: string
}
