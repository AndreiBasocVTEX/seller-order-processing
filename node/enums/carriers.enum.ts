export const CarriersEnum = {
  FANCOURIER: '_cancourier', // aka. SelfAwb
  CARGUS: '_cargus',
  SAMEDAY: '_sameday',
  INNOSHIP: '_innoship',
} as const

export type CarrierIDS = keyof typeof CarriersEnum
export type CarrierValues = typeof CarriersEnum[CarrierIDS]
