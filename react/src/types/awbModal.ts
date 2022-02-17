import type { IOrderAwb } from './common'

export type IOrderAwbProps = {
  setTrackingNum: (v: { [k: string]: string }) => void
  setOrderAwb?: (v: (a: IOrderAwb[]) => IOrderAwb[]) => void
  updateAwbData?: (v: {
    courier: string
    invoiceNumber: string
    invoiceValue: number
    issuanceDate: string
    trackingNumber: string
  }) => void
  neededOrderId: string
  onAwbUpdate: (v: boolean) => void
  refreshOrderDetails?: () => void
  resetOrdersData?: (
    orderId: string,
    invoiceKey: string | null,
    invoiceNumber: string,
    invoiceUrl: string | null
  ) => void
}
