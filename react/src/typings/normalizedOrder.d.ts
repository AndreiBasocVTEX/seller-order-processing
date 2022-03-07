interface ShippingAddressData {
  city: string
  postalCode: string
  phone: string
  receiverName: string
  state: string | null
  street: string
}

export interface AttachmentPackages {
  courier: string
  courierStatus?: {
    data: {
      city: string | null
      createDate: string
      description: string
      lastChange: string
    }
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
}

export interface ClientProfileData {
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

interface InvoiceDataAddress {
  city: string
  complement?: string | null
  country: string
  geoCoordinates?: [string] | null
  invoicedEntityType: string
  neighborhood?: string | null
  number: string
  postalCode: string
  reference?: string | null
  state: string | null
  street: string
}

export interface OrderItem {
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

export interface FormattedOrderStatus {
  color: string
  bgColor: string
  longText: string
  shortText?: string
}

interface LogisticsInfo {
  price: number
  shippingEstimateDate: string
}

interface ShippingData {
  address: ShippingAddressData
  logisticsInfo: [LogisticsInfo]
}

export interface OrderDetailsData {
  clientProfileData: ClientProfileData
  creationDate: string
  elefantOrderId: string | null
  formattedOrderStatus?: FormattedOrderStatus
  invoiceData: {
    address: InvoiceDataAddress
  }
  items: [OrderItem]
  orderId: string
  orderTotals: {
    [key: string]: number
  }
  openTextField: {
    value: string | null
  }
  marketPlaceOrderId: string
  packageAttachment: {
    packages: AttachmentPackages | null
  }
  shippingData: ShippingData
  shippingEstimatedDate: string | null
  status: string
  totals: [
    {
      id: string
      name: string
      value: number
    }
  ]
  value: number
}
