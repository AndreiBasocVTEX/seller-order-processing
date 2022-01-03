export interface IAuthDataFancourier {
  client_id: string
  user_pass: string
  username: string
}

export interface IFancourierAwbPayload {
  service: string
  shipmentDate: string
  addressFrom: unknown
  addressTo: {
    name: string
    contactPerson: string
    country: string
    countyName: string
    localityName: string
    localityId?: string
    fixedLocationId?: string
    addressText?: string
    street: string
    number: string
    neighborhood: unknown
    complement: unknown
    reference: unknown
    postalCode: string
    phone: string
    email: string
  }
  payment: number
  content: {
    envelopeCount: number
    parcelsCount: number
    totalWeight: number
    contents: string
    parcels: Array<{
      sequenceNo: number
      weight: number
      type: number
      reference1: string
      size: {
        width: number
        height: number
        length: number
      }
    }>
  }
  externalClientLocation: string
  externalOrderId: string
  sourceChannel: string
  courierId?: string
  serviceId?: number
  value?: number
  extra: {
    declaredValue: number
    bankRepaymentAmount: number
  }
}
