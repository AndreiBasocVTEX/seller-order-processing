export const CarriersEnum = {
  FANCOURIER: 'fancourier', // aka. SelfAwb
  CARGUS: 'cargus',
  SAMEDAY: 'sameday',
  INNOSHIP: 'innoship',
} as const

export type CarrierIDS = keyof typeof CarriersEnum
export type CarrierValues = typeof CarriersEnum[CarrierIDS]
