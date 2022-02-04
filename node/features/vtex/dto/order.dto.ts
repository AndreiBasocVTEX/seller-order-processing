export type IVtexOrder = any
export type Item = any
export interface NotifyInvoiceDTO {
  type: 'Output'
  invoiceNumber: string
  courier: string
  trackingNumber: string
  trackingUrl?: string
  items: InvoiceItem[]
  issuanceDate: string
  invoiceValue: number
}

export interface InvoiceItem {
  id: string
  quantity: number
  price: number
}
