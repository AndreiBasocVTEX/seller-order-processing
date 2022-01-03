export const awbContent = 'goods'
export const awbSourceChannel = 'ONLINE'

export const defaultCountryCode = 'RO'
export const defaultEnvelopeCount = 0
export const defaultAWBFormat = 'A4'
export const pickupServiceId = 3
export const awbStatusNew = 'New'
export const shipmentPaymentMethod = 1
export const toDoStep = 'toDo'
export const completedStep = 'completed'
export const canceledStatus = 'canceled'

export const allFilterStatuses = {
  waitingAuth:
    'waiting-ffmt-authorization,on-order-completed-ffm,order-accepted',
  paymentPending: 'payment-pending',
  paymentApproved: 'payment-approved',
  readyForHandling: 'ready-for-handling',
  handling: 'handling',
  invoiced: 'invoiced',
  canceled: 'canceled',
  windowToCancel: 'window-to-cancel',
}

export const allShippingEstimates = {
  nextDays: '7.days',
  tomorrow: '1.days',
  today: '0.days',
  late: '-1.days',
}

export const constants = {
  price_multiplier: 100,
  shipping: 'Shipping',
  auto: 'auto',
  promissory: 'promissory',
  window_to_cancel: 'window-to-cancel',
  pickup: 'pickup',
}
