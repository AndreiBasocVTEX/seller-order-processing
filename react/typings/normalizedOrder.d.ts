export interface AddressData {
  city: string
  postalCode: string
  phone: string
  receiverName: string
  state: string
  street: string
}
export interface PackageData {
  courier: string
  invoiceNumber: string
  invoiceUrl: string | null
  invoiceValue: number
  issuanceDate: string
  trackingNumber: string
  trackingUrl: string | null
}
export interface OrderItem {
  freightCommission: number
  name: string
  priceDefinition: {
    calculatedSellingPrice: number
    total: number
  }
  sellerSku: string
  quantity: number
  tax: number
  taxCode: string
}
export interface OrderStatus {
  tagBgColor: string
  tagColor: string
  tagText: string
}
export interface LogisticsInfo {
  price: number
  shippingEstimateDate: string
}

export interface ShippingData {
  address: AddressData
  logisticsInfo: [LogisticsInfo]
}

export interface OrderDetailsData {
  clientData: {
    firstName: string
    lastName: string
    phone: string
    email: string
    isCorporate: boolean
  }
  invoiceData: {
    city: string
    postalCode: string
    invoicedEntityType: string
    phone: string
    state: string
    street: string
  }
  items: [OrderItem]
  orderDate: string
  orderTotals: {
    [key: string]: number
  }
  marketPlaceOrderId: string
  packageData?: PackageData
  paymentMethod: string
  shippingAddress: AddressData
  shippingData: ShippingData
  shippingEstimatedDate?: string
  status: string
  totals: [
    {
      id: string
      name: string
      value: number
    }
  ]
}
