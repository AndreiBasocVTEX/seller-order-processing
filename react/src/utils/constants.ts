export const awbContent = 'goods'
export const awbSourceChannel = 'ONLINE'
export const defaultCountryCode = 'RO'
export const defaultEnvelopeCount = 0
export const defaultAWBFormat = 'A4'
export const shipmentPaymentMethod = 1
export const totalOrderDiscount = 0
export const priceMultiplier = 100
export const promissory = 'promissory'
export const SMARTBILL = 'smartbill'

export const deliveryStatus = {
  READY_FOR_HANDLING: 'ready-for-handling',
  WAITING_FOR_SELLERS_CONFIRMATION: 'waiting-for-sellers-confirmation',
  PAYMENT_APPROVED: 'payment-approved',
  CANCELED: 'canceled',
  INVOICED: 'invoiced',
  HANDLING: 'handling',
  PAYMENT_PENDING: 'payment-pending',
  CANCELLATION_REQUESTED: 'cancellation-requested',
} as const
