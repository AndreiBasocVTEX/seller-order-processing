import type { FormattedOrderStatus } from '../typings/normalizedOrder'

export interface IOrderHeaderProps {
  orderId: string
  orderStatus?: FormattedOrderStatus
}

export interface IOrderTableItem {
  productSku: string
  productName: string
  productQuantity: number | null
  productPriceTva: string
}
