export interface IOrder {
  ShippingEstimatedDate: string
  ShippingEstimatedDateMax: string
  ShippingEstimatedDateMin: string
  affiliateId: string
  authorizedDate: string
  callCenterOperatorName: string
  clientName: string
  creationDate: string
  currencyCode: string
  deliveryDates: unknown
  giftCardProviders: unknown
  hostname: string
  invoiceInput: unknown
  invoiceOutput: string[]
  isAllDelivered: boolean
  isAnyDelivered: boolean
  items: unknown
  lastChange: string
  lastMessageUnread: string
  listId: string
  listType: string
  marketPlaceOrderId: string
  orderFormId: string
  orderId: string
  orderIdElefant: string
  orderIsComplete: boolean
  origin: string
  paymentApprovedDate: string
  paymentNames: string
  readyForHandlingDate: string
  salesChannel: string
  sequence: string
  status: string
  statusDescription: string
  totalItems: number
  totalValue: number
  workflowInErrorState: boolean
  workflowInRetry: boolean
  awbShipping: string // nonexistent data
  awbStatus: string // nonexistent data
  invoice: string // nonexistent data
}
