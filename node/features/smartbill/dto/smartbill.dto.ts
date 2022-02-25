import type { IOContext } from '@vtex/api'

import type { IVtexOrder } from '../../vtex/dto/order.dto'

export interface SmartbillInvoiceRequestDTO {
  country: string
  email?: string
  name: string
  address: string
  city: string
  county: string
  vatCode?: string
}

export interface TaxName {
  name: string
  percentage: number
}

export interface SmartBillGenerateInvoiceRes {
  errorText: string
  message: string
  number: string
  series: string
  url: string
}

export interface CreateInvoiceRequest {
  settings: IOContext['settings']
  order: IVtexOrder
}

export interface CreateInvoicePayload extends CreateInvoiceRequest {
  productTaxNames: SmartbillTaxCodeNamesResponse
}

export interface SmartbillTaxCodeNamesResponse {
  errorText: string
  message: string
  number: string
  series: string
  taxes: SmartbillTaxes[]
}

interface SmartbillTaxes {
  name: string
  percentage: number
}
