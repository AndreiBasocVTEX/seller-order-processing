export interface IInnoshipAwbResponse {
  clientOrderId: number
  courierShipmentId: string
  courier: number
  price: Price
  calculatedDeliveryDate: string
  trackPageUrl: string
  extra: Extra
}

interface Extra {
  bankRepaymentAmount: number
}

interface Price {
  amount: number
  vat: number
  totalAmount: number
  currency: string
}

export interface IInnoshipTrackAwbResponse {
  orderId: number
  courier: number
  shipmentAwb: number
  carrierMeasuredWeight: number
  history: IInnoshipTrackAwbEvent[]
  ReturnAwb: string
  ReturnAwbHistory: IInnoshipTrackAwbEvent[]
  cashOnDeliveryHistory: IInnoshipTrackAwbEvent[]
}

interface IInnoshipTrackAwbEvent {
  clientStatusId: number
  clientStatusDescription: string
  eventDate: Date
  isFinalStatus: boolean
}
