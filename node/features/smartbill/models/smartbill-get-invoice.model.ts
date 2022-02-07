import type { IOContext } from '@vtex/api'

export interface GetInvoiceRequest {
  settings: IOContext['settings']
  invoiceNumber: string
}
