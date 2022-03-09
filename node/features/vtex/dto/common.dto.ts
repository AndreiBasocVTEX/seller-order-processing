export interface VtexRequest<T> {
  payload: T
}

export interface OrderAwareVtexRequest<T> extends VtexRequest<T> {
  orderId: string
  invoiceNumber?: string
}
