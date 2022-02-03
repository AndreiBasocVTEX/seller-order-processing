export interface OrderTrackingEvents {
  date: string
  description: string
}

export interface OrderAwbStatus {
  isDelivered: boolean
  trackingEvents: [OrderTrackingEvents]
}
