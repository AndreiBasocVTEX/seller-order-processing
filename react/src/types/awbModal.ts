import type { IOrderAwb } from './common'
import type { OrderDetailsData } from '../typings/normalizedOrder'

export type IOrderAwbProps = {
  setOrderAwb?: (v: (a: IOrderAwb[]) => IOrderAwb[]) => void
  updateAwbData?: (v: {
    courier: string
    invoiceNumber: string
    invoiceValue: number
    issuanceDate: string
    trackingNumber: string
  }) => void
  neededOrderId?: string
  order: OrderDetailsData
  onAwbUpdate: (v: boolean) => void
  refreshOrderDetails?: () => void
  resetOrdersData?: (
    orderId: string,
    invoiceKey: string | null,
    invoiceNumber: string,
    invoiceUrl: string | null
  ) => void
}
