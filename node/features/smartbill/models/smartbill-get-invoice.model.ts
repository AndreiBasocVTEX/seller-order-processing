import type { CarrierClientRequest } from '../../shared/clients/carrier-client'

export interface GetInvoiceRequest extends CarrierClientRequest {
  invoiceNumber: string
}
