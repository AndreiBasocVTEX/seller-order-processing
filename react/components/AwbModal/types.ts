import type { IOrderAwb } from '../../typings/common'
import type { IOrder } from '../../typings/order'

export type IOrderAwbProps = {
  rowData: IOrder | undefined
  isClosed: boolean
  setIsClosed: (v: boolean) => void
  setTrackingNum: (v: { [k: string]: string }) => void
  setOrderAwb: (v: (a: IOrderAwb[]) => IOrderAwb[]) => void
}
