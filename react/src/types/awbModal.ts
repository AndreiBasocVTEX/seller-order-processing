import type { Dispatch, SetStateAction } from 'react'

import type { OrderDetailsData } from '../typings/normalizedOrder'
import type { Providers } from '../typings/Providers'

export type IOrderAwbProps = {
  modalOpenId: string
  setOpenModalId: Dispatch<SetStateAction<string>>
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
  availableProviders: Providers
}
