import type { OrderDetailsData } from '../typings/normalizedOrder'
import type { IOrder } from '../typings/order'

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
  payMethod?: string
  invoiceNumber?: string
}
