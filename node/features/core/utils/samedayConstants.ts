export const defaultAWBFormat = 'A4'
export const awbContent = 'goods'
export const requestHeaders = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
}
export const defaultEnvelopeCount = 0
export const selectedPickup = 139
export const pickupServiceId = 3
export const awbStatusNew = 'AWB Emis'
export const toDoStep = 'toDo'
export const completedStep = 'completed'
export const canceledStatus = 'canceled'

export const allFilterStatuses = {
  waitingAuth:
    'waiting-ffmt-authorization,on-order-completed-ffm,order-accepted',
  paymentPending: 'payment-pending',
  paymentApproved: 'payment-approved',
  handling: 'handling',
  readyForHandling: 'ready-for-handling',
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

export const samedayConstants = {
  price_multiplier: 100,
  invoiced: 'invoiced',
  handling: 'handling',
  shipping: 'Shipping',
  taxes: 'Tax',
  auto: 'auto',
  promissory: 'promissory',
  ready_for_handling: 'ready-for-handling',
  window_to_cancel: 'window-to-cancel',
  pickup: 'pickup',
}
