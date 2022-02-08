import type { OrderDetailsData } from '../typings/normalizedOrder'

export interface IOrderDetailProps {
  orderData: OrderDetailsData
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
