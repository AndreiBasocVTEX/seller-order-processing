import type { IOContext } from '@vtex/api'
import { ExternalClient } from '@vtex/api'

import type { Item, IVtexInvoiceData, IVtexOrder, VtexEvent } from './orderApi'

export interface ITrackAwbInfoPayload {
  pathParams: {
    orderId: string
    invoiceNumber: string
  }
  payload: {
    isDelivered: boolean
    deliveredDate?: string
    events?: VtexEvent[]
  }
}

export type GetAWBInfoParams = {
  settings: IOContext['settings']
  order: IVtexOrder
}

export interface RequestAWBForInvoiceResponse {
  orderId: string
  trackingNumber: string
  courier: string
  items: Item[]
  trackingUrl?: string
}

export interface IBodyForRequestAwb {
  order: IVtexOrder
  settings: IOContext['settings']
  invoiceData: IVtexInvoiceData
}

export interface PrintAWBParams<PayloadType = { [key: string]: unknown }> {
  settings: IOContext['settings']
  payload: PayloadType
}

export abstract class CarrierClient extends ExternalClient {
  protected abstract requestAWB({
    settings,
    invoiceData,
    order,
  }: IBodyForRequestAwb): Promise<unknown>

  abstract getAWBInfo({
    settings,
    order,
  }: GetAWBInfoParams): Promise<ITrackAwbInfoPayload>

  abstract requestAWBForInvoice({
    order,
    settings,
    invoiceData,
  }: {
    order: IVtexOrder
    settings: IOContext['settings']
    invoiceData: IVtexInvoiceData
  }): Promise<RequestAWBForInvoiceResponse>

  abstract printAWB({ settings, payload }: PrintAWBParams): unknown
}
