import type { FormattedOrderStatus } from '../typings/normalizedOrder'

export interface IOrderHeaderProps {
  orderId: string
  orderStatus?: FormattedOrderStatus
}

export interface IOrderTableItem {
  productSku: string
  productName: {
    name: string
    id?: string
  }
  productQuantity: number | null
  productPriceTva: string
}
