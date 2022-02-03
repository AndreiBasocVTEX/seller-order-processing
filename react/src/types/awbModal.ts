import type { IOrder } from '../typings/order'
import type { IOrderAwb } from './common'

export type IOrderAwbProps = {
  rowData: IOrder | undefined
  isClosed: boolean
  setIsClosed: (v: boolean) => void
  setTrackingNum: (v: { [k: string]: string }) => void
  setOrderAwb: (v: (a: IOrderAwb[]) => IOrderAwb[]) => void
}
