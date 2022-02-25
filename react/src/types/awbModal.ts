import type { OrderDetailsData } from '../typings/normalizedOrder'

export type IOrderAwbProps = {
  updateAwbData?: (v: {
    courier: string
    invoiceNumber: string
    invoiceValue: number
    issuanceDate: string
    trackingNumber: string
  }) => void
  order: OrderDetailsData
  onAwbUpdate: (v: boolean) => void
  refreshOrderDetails?: () => void
}
