import type { CreateTrackingRequestParams } from '../../shared/clients/carrier-client'
import type { IVtexOrder } from '../../vtex/dto/order.dto'

export interface CargusDataToCreateAwb {
  order: IVtexOrder
  senderLocationId: string
  priceTableId: number
  trackingParams: CreateTrackingRequestParams
}

export interface ICargusAwbPayload {
  DeliveryPudoPoint?: number | null
  ReturnCodeExpiration?: string
  SenderClientId?: number | null
  TertiaryClientId?: number | null
  TertiaryLocationId?: number | null
  Sender: Sender
  Recipient: Recipient
  Parcels: number
  Envelopes: number
  TotalWeight: number
  ServiceId: number | null
  DeclaredValue?: number
  CashRepayment: number
  BankRepayment?: number
  OtherRepayment?: string
  BarCodeRepayment?: string
  PaymentInstrumentId?: number
  PaymentInstrumentValue?: number
  HasTertReimbursement?: boolean
  OpenPackage?: boolean
  PriceTableId?: number
  ShipmentPayer: number
  ShippingRepayment?: number
  SaturdayDelivery?: boolean
  MorningDelivery?: boolean
  HasNonStandardParcel?: boolean
  DeliveryTime?: number
  Observations?: string
  PackageContent?: string
  CustomString: string
  BarCode?: string
  ParcelCodes: ParcelCode[]
  ValidationDate?: string
  ShippingCost?: ShippingCost
  Status?: string
  SenderReference1?: string
  RecipientReference1?: string
  RecipientReference2?: string
  InvoiceReference?: string
  Length?: number
  Width?: number
  Height?: number
  TransitPriority?: string
  TransitRoute?: string
  TransitCodes?: string
  DeliveryRoute?: string
  OriginDeposit?: string
  Transit1Deposit?: string
  Transit2Deposit?: string
  OriginDepositFinger?: string
  Transit1DepositFinger?: string
  Transit2DepositFinger?: string
}

export interface ShippingCost {
  BaseCost: number
  ExtraKmCost: number
  WeightCost: number
  InsuranceCost: number
  SpecialCost: number
  RepaymentCost: number
  Subtotal: number
  Tax: number
  GrandTotal: number
}

export interface ParcelCode {
  Code: string
  Type: number
  Weight: number
  Length: number
  Width: number
  Height: number
  // ParcelContent?: string
}

export interface Sender {
  LocationId: number | string | null
  Name?: string
  CountyId?: number
  CountyName?: string
  LocalityId?: number
  LocalityName?: string
  StreetId?: number
  StreetName?: string
  BuildingNumber?: string
  AddressText?: string
  ContactPerson?: string
  PhoneNumber?: string
  Email?: string
  CodPostal?: string
  PostalCode?: string
  CountryId?: number
}

export interface Recipient {
  LocationId?: number
  Name: string
  CountyId?: number
  CountyName: string
  LocalityId?: number
  LocalityName: string
  StreetId?: number
  StreetName?: string
  BuildingNumber?: string
  AddressText: string
  ContactPerson: string
  PhoneNumber: string
  Email: string
  CodPostal?: string
  PostalCode: string
  CountryId?: number
}

export interface ICargusAwbResponse {
  IdComanda: number
  ReturnCode: string
  ReturnCodeExpiration?: string
  Sender: Sender
  Recipient: Recipient
  SenderClientId?: number | null
  TertiaryClientId?: number | null
  TertiaryLocationId?: number | null
  Parcels: number
  Envelopes: number
  TotalWeight: number
  ServiceId: number
  DeclaredValue: number
  CashRepayment: number
  BankRepayment: number
  OtherRepayment: string
  BarCodeRepayment?: string
  PaymentInstrumentId: number
  PaymentInstrumentValue: number
  HasTertReimbursement: boolean
  OpenPackage: boolean
  PriceTableId: number
  ShipmentPayer: number
  ShippingRepayment?: number
  SaturdayDelivery: boolean
  MorningDelivery: boolean
  HasNonStandardParcel: boolean
  DeliveryTime: number
  Observations: string
  PackageContent: string
  CustomString: string
  BarCode: string
  ParcelCodes: ParcelCode[]
  ValidationDate: string
  ShippingCost: ShippingCost
  Status: string
  SenderReference1: string
  RecipientReference1: string
  RecipientReference2: string
  InvoiceReference: string
  Width: number
  Length: number
  Height: number
  TransitPriority: string
  TransitRoute: string
  TransitCodes: string
  DeliveryRoute: string
  OriginDeposit: string
  Transit1Deposit: string
  Transit2Deposit: string
  OriginDepositFinger: string
  Transit1DepositFinger: string
  Transit2DepositFinger: string
}

export interface ICargusTrackAwbResponse {
  Code: string
  Type: string
  MeasuredWeight: number
  VolumetricWeight: number
  ConfirmationName: string
  Observation: string
  ResponseCode: string
  Event: ICargusTrackAwbEvent[]
}

export interface ICargusTrackAwbEvent {
  Date: string
  EventId: number
  Description: string
  LocalityName: string
}
