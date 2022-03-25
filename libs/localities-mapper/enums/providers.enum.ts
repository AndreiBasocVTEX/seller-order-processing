export const ProvidersEnum = {
  FANCOURIER: 'fancourier', // aka. SelfAwb
  CARGUS: 'cargus',
  SAMEDAY: 'sameday',
  INNOSHIP: 'innoship',
} as const

export type ProviderIDS = keyof typeof ProvidersEnum
export type ProviderValues = typeof ProvidersEnum[ProviderIDS]
