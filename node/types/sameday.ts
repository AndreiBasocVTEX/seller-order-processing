export interface IAuthDataSameday {
  token: string
  expire_at: Date
}

export interface ISamedayAwbPayload {
  awbPayment: number
  awbRecipient: AwbRecipient
  cashOnDelivery: number
  geniusOrder: number
  insuredValue: number
  observation: string
  packageType: number
  packageWeight: number
  parcels: Parcel[]
  pickupPoint: number
  service: number
  thirdPartyPickup: number
}

interface Parcel {
  sequenceNo: number
  weight: number
  type: number
  reference1: string
  size: Size
}

interface Size {
  width: number
  height: number
  length: number
}

interface AwbRecipient {
  address: string
  cityString: string
  county: number
  email: string
  name: string
  personType: number
  phoneNumber: string
  postalCode: string
}

export interface ISamedayAwbResponse {
  awbNumber: string
  awbCost: number
  parcels: ParcelSamedayRes[]
  pdfLink: string
  pickupLogisticLocation: string
  deliveryLogisticLocation: string
  deliveryLogisticCircle: string
  sortingHub: string
  sortingHubId: number
  deliveryLogisticLocationId: number
  pickupLogisticLocationId: number
}
interface ParcelSamedayRes {
  position: number
  awbNumber: string
}
