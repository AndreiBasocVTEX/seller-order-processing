import cargus from '../public/logos/cargus.png'
import fancourier from '../public/logos/fancourier.png'
import innoship from '../public/logos/innoship.png'
import sameday from '../public/logos/sameday.png'
import facturis from '../public/logos/facturis.png'
import smartbill from '../public/logos/smartbill.png'
import download from '../public/logos/download.png'

export const awbContent = 'goods'
export const awbSourceChannel = 'ONLINE'
export const defaultCountryCode = 'RO'
export const defaultEnvelopeCount = 0
export const defaultAWBFormat = 'A4'
export const shipmentPaymentMethod = 1
export const totalOrderDiscount = 0
export const priceMultiplier = 100
export const promissory = 'promissory'
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

export const courierData = [
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
export const disabledCouriers = ['DHL', 'TNT', 'GLS', 'DPD']
