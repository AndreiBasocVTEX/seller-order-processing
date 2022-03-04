import type { OrderAwareVtexRequest } from './common.dto'

export interface TrackAndInvoiceRequestDTO {
  invoice: InvoiceRequestDTO
  tracking: TrackingRequestDTO
}

export interface TrackingRequestDTO {
  provider: 'innoship' | 'cargus' | 'fancourier' | 'sameday'
  generate: boolean
  params: {
    packageType: 'envelope' | 'parcel'
    weight?: number
    numberOfPackages: number
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

export type NotifyInvoiceRequestDTO = OrderAwareVtexRequest<NotifyTrackAndInvoicePayload>

export interface NotifyTrackAndInvoicePayload
  extends TrackingInfoDTO,
    InvoiceInfoDTO {}

export interface InvoiceInfoDTO {
  type: 'Output'
  invoiceNumber: string
  issuanceDate: string
  invoiceValue: number
  items?: InvoiceItem[]
  invoiceUrl?: string
  invoiceKey?: string
}

export interface TrackingInfoDTO {
  trackingNumber: string
  courier: string
  trackingUrl?: string
}

export interface InvoiceItem {
  id: string
  quantity: number
  price: number
}
