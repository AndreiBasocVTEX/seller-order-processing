export interface IInnoshipAwbResponse {
  clientOrderId: number
  courierShipmentId: string
  courier: number
  price: Price
  calculatedDeliveryDate: string
  trackPageUrl: string
  extra: Extra
}

interface Price {
  amount: number
  vat: number
  totalAmount: number
  currency: string
}

export interface IInnoshipTrackAwbResponse {
  orderId: number
  courier: number
  shipmentAwb: number
  carrierMeasuredWeight: number
  history: IInnoshipTrackAwbEvent[]
  ReturnAwb: string
  ReturnAwbHistory: IInnoshipTrackAwbEvent[]
  cashOnDeliveryHistory: IInnoshipTrackAwbEvent[]
}

interface IInnoshipTrackAwbEvent {
  clientStatusId: number
  clientStatusDescription: string
  eventDate: Date
  isFinalStatus: boolean
}
export interface InnoshipAwbPayload {
  serviceId: number
  courierId?: number
  shipmentDate: string | Date
  shipmentDateEnd?: Date
  addressFrom?: Address | null
  addressTo: Address
  content: Content
  payment: string
  externalClientLocation: string
  externalOrderId: string
  sourceChannel?: string
  observation?: string
  extra?: Extra
  parameters?: Parameters
}

interface Extra {
  bankRepaymentAmount?: number
  bankRepaymentCurrency?: string
  bank?: string
  bankIBAN?: string
  cashOnDeliveryAmount?: number
  cashOnDeliveryAmountCurrency?: string
  declaredValueAmount?: number
  declaredValueAmountCurrency?: string
  openPackage?: boolean
  saturdayDelivery?: boolean
  insuranceAmount?: number
  reference1?: string
  reference2?: string
  reference3?: string
  reference4?: string
  returnOfDocuments?: boolean
  returnOfDocumentsCommen?: string
  returnPackage?: boolean
}

interface Content {
  envelopeCount: number
  parcelsCount: number
  palettesCount: number
  totalWeight: number
  contents: string
  package?: string
  oversizedPackage?: boolean
  parcels?: Parcel[]
}

interface Address {
  name: string
  contactPerson: string
  country: string
  countyName: string
  localityName: string
  addressText: string
  postalCode?: string
  phone: string
  email?: string
}

interface Parcel {
  sequenceNo: number
  size: Size
  weight: number
  type: string | number
  reference1: string
  customerBarcode?: string
}

interface Size {
  width: number
  length: number
  height: number
}

interface Parameters {
  getParcelsBarcodes?: boolean
  includeCourierResponse?: boolean
  includePriceBreakdown?: boolean
}
