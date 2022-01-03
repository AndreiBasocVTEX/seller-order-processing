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
