import type { OrderDetailsData } from './normalizedOrder'
import type { IOrder } from './order'

export interface IOrderDetailProps {
  orderData: OrderDetailsData
  rawOrderData?: IOrder
}

export interface ITrackingObj {
  [orderId: string]: string
}

export interface IOrderAwb {
  orderId: string
  orderValue: string
  courier: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payMethod?: string | any
  invoiceNumber?: string
}
