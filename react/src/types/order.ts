export interface IOrderHeaderProps {
  orderId: string
  orderStatus?: string
}

export interface IOrderStatus {
  tagBgColor: string
  tagColor: string
  tagText: string
}

export interface IOrderTableItem {
  productSku: string
  productName: string
  productQuantity: number
  productPriceNoTva: string
  tvaProcent: string
  productPriceTva: string
}
