export interface TrackAndInvoiceRequestDTO {
  invoice: InvoiceRequestDTO
  tracking: TrackingRequestDTO
}

export interface TrackingRequestDTO {
  provider: 'innoship' | 'cargus' | 'fancourier' | 'sameday'
  generate: boolean
  params: {
    weight?: number
    numberOfParcels?: number
    trackingNumber?: string
    trackingUrl?: string
  }
}

export interface InvoiceRequestDTO {
  provider: 'smartbill' | 'manual'
  params: {
    issuanceDate: string
    invoiceNumber: string
    invoiceValue: number
    invoiceUrl?: string
    type: string
  }
}

export interface ITrackAwbInfoResponse {
  date: string
  orderId: string
  receipt: string
}

// export interface IVtexOrder {
//   emailTracked?: string
//   approvedBy?: string
//   cancelledBy?: string
//   cancelReason?: string
//   orderId: string
//   sequence: string
//   marketplaceOrderId: string
//   marketplaceServicesEndpoint: string
//   sellerOrderId?: string
//   origin: string
//   affiliateId: string
//   salesChannel: string
//   merchantName?: string
//   status: string
//   statusDescription: string
//   value: number
//   creationDate: string
//   lastChange: string
//   orderGroup?: string
//   totals: Total[]
//   items: Item[]
//   marketplaceItems: any[]
//   clientProfileData: ClientProfileData
//   giftRegistryData?: unknown
//   marketingData?: string
//   ratesAndBenefitsData: RatesAndBenefitsData
//   shippingData: ShippingData
//   paymentData: PaymentData
//   packageAttachment: PackageAttachment
//   sellers: Seller[]
//   callCenterOperatorData?: unknown
//   followUpEmail: string
//   lastMessage?: unknown
//   hostname: string
//   invoiceData?: unknown
//   changesAttachment: ChangesAttachment
//   openTextField?: unknown
//   roundingError: number
//   orderFormId: string
//   commercialConditionData?: unknown
//   isCompleted: boolean
//   customData?: string
//   storePreferencesData: StorePreferencesData
//   allowCancellation: boolean
//   allowEdition: boolean
//   isCheckedIn: boolean
//   marketplace: Marketplace
//   authorizedDate: string
//   invoicedData?: InvoiceData
// }

// interface Marketplace {
//   baseURL: string
//   isCertified?: unknown
//   name: string
// }

// interface InvoiceData {
//   reason: string
//   address: Address2
//   discountValue: number
//   userPaymentInfo: UserPaymentInfo
// }

// interface UserPaymentInfo {
//   paymentMethods: string[]
// }

// interface Address2 {
//   postalCode: string
//   city: string
//   state: string
//   country: string
//   street: string
//   number: string
//   neighborhood?: any
//   complement?: any
//   reference?: any
//   geoCoordinates: any[]
// }

// interface StorePreferencesData {
//   countryCode: string
//   currencyCode: string
//   currencyFormatInfo: CurrencyFormatInfo
//   currencyLocale: number
//   currencySymbol: string
//   timeZone: string
// }

// interface CurrencyFormatInfo {
//   CurrencyDecimalDigits: number
//   CurrencyDecimalSeparator: string
//   CurrencyGroupSeparator: string
//   CurrencyGroupSize: number
//   StartsWithCurrencySymbol: boolean
// }

// interface ChangesAttachment {
//   id: string
//   changesData: ChangesDatum[]
// }

// interface ChangesDatum {
//   reason: string
//   discountValue: number
//   incrementValue: number
//   itemsAdded: any[]
//   itemsRemoved: ItemsRemoved[]
//   receipt: Receipt
// }

// interface Receipt {
//   date: string
//   orderId: string
//   receipt: string
// }

// interface ItemsRemoved {
//   id: string
//   name: string
//   quantity: number
//   price: number
//   unitMultiplier?: number
// }

// interface Seller {
//   id: string
//   name: string
//   logo?: string
//   fulfillmentEndpoint?: any
// }

// interface PackageAttachment {
//   packages: any[]
// }

// interface PaymentData {
//   transactions: Transaction[]
// }

// interface Transaction {
//   isActive: boolean
//   transactionId?: string
//   merchantName?: string
//   payments: Payment[]
// }

// interface Payment {
//   id?: string
//   paymentSystem: string
//   paymentSystemName: string
//   value: number
//   installments: number
//   referenceValue: number
//   cardHolder?: string
//   cardNumber?: any
//   firstDigits?: string
//   lastDigits?: string
//   cvv2?: any
//   expireMonth?: any
//   expireYear?: any
//   url?: string
//   giftCardId?: string
//   giftCardName?: string
//   giftCardCaption?: string
//   redemptionCode?: string
//   group?: string
//   tid?: string
//   dueDate?: string
//   connectorResponses: Content
//   billingAddress?: BillingAddress
//   giftCardProvider?: any
//   giftCardAsDiscount?: any
//   koinUrl?: any
//   accountId?: any
//   parentAccountId?: any
//   bankIssuedInvoiceIdentificationNumber?: any
//   bankIssuedInvoiceIdentificationNumberFormatted?: any
//   bankIssuedInvoiceBarCodeNumber?: any
//   bankIssuedInvoiceBarCodeType?: any
// }

// interface BillingAddress {
//   postalCode: string
//   city: string
//   state: string
//   country: string
//   street: string
//   number: string
//   neighborhood: string
//   complement?: string
//   reference?: string
//   geoCoordinates: number[]
// }

// interface ShippingData {
//   id: string
//   address: Address
//   logisticsInfo: LogisticsInfo[]
//   trackingHints?: any[]
//   selectedAddresses: Address[]
// }

// interface LogisticsInfo {
//   itemIndex: number
//   selectedSla: string
//   lockTTL: string
//   price: number
//   listPrice: number
//   sellingPrice: number
//   deliveryWindow?: any
//   deliveryCompany: string
//   shippingEstimate: string
//   shippingEstimateDate: string
//   slas?: Sla[]
//   shipsTo?: string[]
//   deliveryIds: DeliveryId[]
//   deliveryChannel: string
//   pickupStoreInfo: PickupStoreInfo
//   addressId: string
//   polygonName?: any
// }

// interface DeliveryId {
//   courierId: string
//   courierName: string
//   dockId: string
//   quantity: number
//   warehouseId: string
// }

// interface Sla {
//   id: string
//   name: string
//   shippingEstimate: string
//   deliveryWindow?: any
//   price: number
//   deliveryChannel: string
//   pickupStoreInfo: PickupStoreInfo
//   polygonName?: any
// }

// interface PickupStoreInfo {
//   additionalInfo?: any
//   address?: any
//   dockId?: any
//   friendlyName?: any
//   isPickupStore: boolean
// }

// interface Address {
//   addressType: string
//   receiverName: string
//   addressId: string
//   postalCode: string
//   city: string
//   state: string
//   country: string
//   street: string
//   number: string
//   neighborhood?: string
//   complement?: string
//   reference?: any
//   geoCoordinates: any[]
// }

// interface RatesAndBenefitsData {
//   id: string
//   rateAndBenefitsIdentifiers: any[]
// }

// interface ClientProfileData {
//   id: string
//   email: string
//   firstName: string
//   lastName: string
//   documentType: string
//   document: string
//   phone: string
//   corporateName?: any
//   tradeName?: any
//   corporateDocument?: any
//   stateInscription?: any
//   corporatePhone?: any
//   isCorporate: boolean
//   userProfileId: string
//   customerClass?: any
// }

// interface Item {
//   uniqueId: string
//   id: string
//   productId: string
//   ean?: any
//   lockId: string
//   itemAttachment: ItemAttachment
//   attachments: any[]
//   quantity: number
//   seller: string
//   name: string
//   refId: string
//   price: number
//   listPrice: number
//   manualPrice?: any
//   priceTags: any[]
//   imageUrl: string
//   detailUrl?: string
//   components: any[]
//   bundleItems: any[]
//   params: any[]
//   offerings: any[]
//   sellerSku: string
//   priceValidUntil?: any
//   commission: number
//   tax: number
//   preSaleDate?: any
//   additionalInfo: AdditionalInfo
//   measurementUnit: string
//   unitMultiplier: number
//   sellingPrice: number
//   isGift: boolean
//   shippingPrice?: any
//   rewardValue: number
//   freightCommission: number
//   priceDefinition: PriceDefinition
//   taxCode?: string
//   parentItemIndex?: any
//   parentAssemblyBinding?: any
//   callCenterOperator?: any
//   serialNumbers?: any
//   assemblies: any[]
//   costPrice: number
// }

// interface PriceDefinition {
//   sellingPrice: SellingPrice[]
//   calculatedSellingPrice: number
//   total: number
// }

// interface SellingPrice {
//   quantity: number
//   value: number
// }

// interface AdditionalInfo {
//   brandName: string
//   brandId: string
//   categoriesIds: string
//   categories: Category[]
//   productClusterId: string
//   commercialConditionId: string
//   dimension: Dimension
//   offeringInfo?: string
//   offeringType?: string
//   offeringTypeId?: string
// }

// interface Dimension {
//   cubicweight: number
//   height: number
//   length: number
//   weight: number
//   width: number
// }

// interface Category {
//   id: number
//   name: string
// }

// interface ItemAttachment {
//   content: Content
//   name?: any
// }

// // eslint-disable-next-line @typescript-eslint/no-empty-interface
// interface Content {}

// interface Total {
//   id: string
//   name: string
//   value: number
// }
