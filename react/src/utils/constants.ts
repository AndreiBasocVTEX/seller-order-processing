import cargus from '../public/logos/cargus.png'
import fancourier from '../public/logos/fancourier.png'
import innoship from '../public/logos/innoship.png'
import sameday from '../public/logos/sameday.png'
import facturis from '../public/logos/facturis.png'
import smartbill from '../public/logos/smartbill.png'
import download from '../public/logos/download.png'

export const SMARTBILL = 'smartbill'

export const deliveryStatus = {
  READY_FOR_HANDLING: 'ready-for-handling',
  WAITING_FOR_SELLERS_CONFIRMATION: 'waiting-for-sellers-confirmation',
  PAYMENT_APPROVED: 'payment-approved',
  CANCELED: 'canceled',
  INVOICED: 'invoiced',
  HANDLING: 'handling',
  PAYMENT_PENDING: 'payment-pending',
  CANCELLATION_REQUESTED: 'cancellation-requested',
  WINDOW_TO_CANCEL: 'window-to-cancel',
} as const

export const courierIcons: { [key: string]: string } = {
  fancourier,
  cargus,
  innoship,
  sameday,
  facturis,
  smartbill,
  download,
  tnt: download,
  dhl: download,
  gls: download,
  dpd: download,
}

export const courierListData = [
  {
    src: 'cargus',
    label: 'Cargus',
    service: 'cargus',
  },
  {
    src: 'sameday',
    label: 'SameDay',
    service: 'sameday',
  },
  {
    src: 'innoship',
    label: 'Innoship',
    service: 'innoship',
  },
  {
    src: 'fancourier',
    label: 'Fan Courier',
    service: 'fancourier',
  },
  {
    src: 'download',
    service: 'manual',
  },
]

export const invoiceListData = [
  {
    src: 'smartbill',
    label: 'Smartbill',
    service: 'smartbill',
  },
  {
    src: 'download',
    service: 'manual',
  },
]
export const disabledCouriers = ['DHL', 'TNT', 'GLS', 'DPD']

export const couriersDropDownList = [
  { value: 'fancourier', label: 'FanCourier' },
  { value: 'cargus', label: 'Cargus' },
  { value: 'sameDay', label: 'SameDay' },
  { value: 'tnt', label: 'TNT' },
  { value: 'dhl', label: 'DHL' },
  { value: 'gls', label: 'GLS' },
  { value: 'dpd', label: 'DPD' },
]
