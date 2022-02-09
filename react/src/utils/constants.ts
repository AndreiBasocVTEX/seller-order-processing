export const awbContent = 'goods'
export const awbSourceChannel = 'ONLINE'
export const defaultCountryCode = 'RO'
export const defaultEnvelopeCount = 0
export const defaultAWBFormat = 'A4'
export const shipmentPaymentMethod = 1
export const totalOrderDiscount = 0
export const priceMultiplier = 100
export const promissory = 'promissory'

export const deliveryStatus = {
  READY_FOR_HANDLING: 'ready-for-handling' as const,
  WAITING_FOR_SELLERS_CONFIRMATION: 'waiting-for-sellers-confirmation' as const,
  PAYMENT_APPROVED: 'payment-approved' as const,
  CANCELED: 'canceled' as const,
  INVOICED: 'invoiced' as const,
  HANDLING: 'handling' as const,
  PAYMENT_PENDING: 'payment-pending' as const,
  CANCELLATION_REQUESTED: 'cancellation-requested' as const,
}
