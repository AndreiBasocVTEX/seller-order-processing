import type { Item, IVtexOrder } from '../../vtex/dto/order.dto'

export function getTotalWeight(order: IVtexOrder) {
  return order.items.reduce((weight: number, item: Item) => {
    return weight + item.additionalInfo.dimension.weight * item.quantity
  }, 0)
}

export function getTotalDiscount(order: IVtexOrder): number {
  if (!order.paymentData.giftCards.length) {
    return 0
  }

  return order.paymentData.transactions[0].payments.reduce(
    (result: number, item: Item) => {
      if (item.redemptionCode) {
        result -= item.value
      }

      return result
    },
    0
  )
}

export const getPaymentMethod = (paymentData: string): string | null => {
  if (!paymentData) return null

  return paymentData.match(/\b(\w+)$/g)?.toString() ?? null
}
