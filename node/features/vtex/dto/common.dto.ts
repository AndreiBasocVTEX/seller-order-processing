import type { VtexAuthData } from './auth.dto'

export interface VtexRequest<T> {
  authData: VtexAuthData
  payload: T
}

export interface OrderAwareVtexRequest<T> extends VtexRequest<T> {
  orderId: string
  invoiceNumber?: string
}

export interface SetOrderStatusToInvoicedReq {
  authData: VtexAuthData
  orderId: string
}