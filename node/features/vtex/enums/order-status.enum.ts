export const enum OrderStatus {
  READY_FOR_HANDLING = 'ready-for-handling',
  WAITING_FOR_SELLERS_CONFIRMATION = 'waiting-for-sellers-confirmation',
  PAYMENT_APPROVED = 'payment-approved',
  CANCELED = 'canceled',
  INVOICED = 'invoiced',
  HANDLING = 'handling',
  PAYMENT_PENDING = 'payment-pending',
  CANCELLATION_REQUESTED = 'cancellation-requested',
  WINDOW_TO_CANCEL = 'window-to-cancel',
}
