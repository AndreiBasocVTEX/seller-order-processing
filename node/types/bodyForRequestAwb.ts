import type { IOContext } from '@vtex/api'

import type OrderApi from '../clients/orderApi'
import type { IVtexInvoiceData } from './orderApi'

export interface IBodyForRequestAwb {
  orderApi: OrderApi
  settings: IOContext['settings']
  orderId: string
  invoiceData: IVtexInvoiceData
}
