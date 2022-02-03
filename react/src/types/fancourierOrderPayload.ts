export interface IFancourierOrderPayload {
  service: string
  shipmentDate: string
  addressFrom: unknown
  addressTo: {
    name: string
    contactPerson: string
    country: string
    countyName: string
    localityName: string
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
    parcels: [
      {
        sequenceNo: number
        weight: number
        type: number
        reference1: string
        size: {
          width: number
          height: number
          length: number
        }
      }
    ]
  }
  externalClientLocation: string
  externalOrderId: string
  sourceChannel: string
  courierId?: string
  value?: number
  extra: {
    declaredValue: number
    bankRepaymentAmount: number
  }
}
