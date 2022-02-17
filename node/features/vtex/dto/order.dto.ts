export type IVtexOrder = any
export type Item = any

export interface VtexOrderTotals {
  id: 'Items' | 'Shipping' | 'Discounts' | 'Tax'
  name: string
  value: number
}
