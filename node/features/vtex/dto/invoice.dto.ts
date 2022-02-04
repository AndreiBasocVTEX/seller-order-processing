import { OrderAwareVtexRequest } from "./common.dto";

export interface NotifyInvoiceRequestDTO extends OrderAwareVtexRequest<NotifyInvoicePayload> {

}
export interface NotifyInvoicePayload {
  type: 'Output'
  invoiceNumber: string
  courier: string
  trackingNumber: string
  trackingUrl?: string
  items?: InvoiceItem[]
  issuanceDate: string
  invoiceValue: number
  invoiceUrl?: string
}

export interface InvoiceItem {
  id: string
  quantity: number
  price: number
}
