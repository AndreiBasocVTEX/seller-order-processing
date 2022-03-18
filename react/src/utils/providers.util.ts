import { getActiveProviders } from './api'
import { courierListData, invoiceListData } from './constants'

export const retrieveActiveProviders = async () => {
  const allActiveProviders = await getActiveProviders()

  const activeAwbCouriers = courierListData.filter(
    (el) => !!allActiveProviders[el.service]
  )

  const activeInvoiceCouriers = invoiceListData.filter(
    (el) => !!allActiveProviders[el.service]
  )

  return { activeAwbCouriers, activeInvoiceCouriers }
}
