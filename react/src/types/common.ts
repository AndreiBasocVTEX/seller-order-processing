import type { OrderDetailsData } from '../typings/normalizedOrder'

export interface IOrderDetailProps {
  orderData: OrderDetailsData
  refreshOrderData?: () => void
}

export interface IStatement {
  error: any
  object: Record<string, any>
  subject: string
  verb: string
}

export interface IDatePickerProp {
  value: { from: Date; to: Date }
  onChange: (date: { from: Date; to: Date }) => void
}

export interface InvoiceButtonProps {
  orderId: string
  invoiceKey?: string | null
  invoiceNumber?: string
  invoiceUrl?: string | null
  orderStatus: string
  service?: string | null
}
export interface GetOrderStatsParams {
  page: number
  perPage: number
  search: string
  status: string
  date: string
}
export interface TablePaginationParams {
  page: number
  perPage: number
  itemsFrom: number
  itemsTo: number
}
export interface TableFilterParams {
  search: string
  status: string
  date: string
}
export interface TableTotalizerData {
  ordersAmount: number
  ordersAverageValue: number
  ordersTotalValue: number
}
export interface TablePaginationProps {
  paginationParams: TablePaginationParams
  totalizerData: TableTotalizerData
  handleTableLoading: (b: boolean) => void
  handlePaginationParams: (p: TablePaginationParams) => void
}
export interface TableFiltersProps {
  filterParams: TableFilterParams
  setFilterParams: (o: TableFilterParams) => void
}
