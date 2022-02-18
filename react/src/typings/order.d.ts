export interface AddressData {
  city: string
  postalCode: string
  receiverName: string
  number: string
  state: string
  street: string
}

export interface ClientData {
  id?: string
  email: string
  firstName: string
  lastName: string
  documentType?: string
  document?: string
  phone: string
  corporateName?: string | null
  tradeName?: string | null
  corporateDocument?: unknown | null
  stateInscription: string | null
  corporatePhone?: string | null
  isCorporate: boolean
  userProfileId?: string | null
  customerClass?: string | null
}

export interface OrderTotals {
  id: string
  name: string
  value: number
}

export interface InvoiceData {
  address: {
    city: string
    country: string
    postalCode: string
    number: string
    state: string
    street: string
  }
}

export interface Item {
  freightCommission: number
  name: string
  id: string
  priceDefinition: {
    calculatedSellingPrice: number
    total: number
  }
  sellerSku: string
  quantity: number
  tax: number
  taxCode: string
}

export interface LogisticsInfo {
  price: number
  shippingEstimateDate: string
}

export interface PackageData {
  courier: string
  courierStatus?: {
    data: [
      {
        city: string | null
        createDate: string
        description: string
        lastChange: string
      }
    ]
    deliveredDate: string
    finished: boolean
    status: string
  }
  invoiceKey: string | null
  invoiceNumber: string
  invoiceUrl: string | null
  invoiceValue: number
  issuanceDate: string
  trackingNumber: string
  trackingUrl: string | null
  invoiceKey?: string
}

export interface PackageAttachment {
  packages: [PackageData]
}

export interface ShippingData {
  address: AddressData
  logisticsInfo: [LogisticsInfo]
}

export interface IOrder {
  ShippingEstimatedDate: string
  ShippingEstimatedDateMax: string
  ShippingEstimatedDateMin: string
  affiliateId: string
  authorizedDate: string
  callCenterOperatorName: string
  clientName: string
  clientProfileData: ClientData
  creationDate: string
  currencyCode: string
  deliveryDates: unknown
  giftCardProviders: unknown
  hostname: string
  invoiceInput: unknown
  invoiceOutput: string[]
  isAllDelivered: boolean
  isAnyDelivered: boolean
  items: [Item]
  invoiceData: InvoiceData
  lastChange: string
  lastMessageUnread: string
  listId: string
  listType: string
  marketplaceOrderId: string
  orderFormId: string
  orderId: string
  orderIdElefant: string
  orderIsComplete: boolean
  origin: string
  openTextField: {
    value: string
  }
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
  packageAttachment: PackageAttachment
  shippingData: ShippingData
  storePreferencesData: {
    countryCode: string
    currencyCode: string
    currencySymbol: string
  }
  totals: [OrderTotals]
  awbShipping: string // nonexistent data
  awbStatus: string // nonexistent data
  invoice: string // nonexistent data
  value: number
}
