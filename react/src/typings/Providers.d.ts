interface ProvidersOptions {
  src: string
  label?: string
  service: string
}

export type Providers = {
  awbServices: ProvidersOptions[]
  invoiceServices: ProvidersOptions[]
}
