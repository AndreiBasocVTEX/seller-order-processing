export interface ICreateAwbResult {
  trackingNumber: string
  courier: string
  invoiceNumber: string
  invoiceValue: number
  issuanceDate: string
  packageType: string
}

export interface ICreateAwbProps {
  orderId: string
  service: string
  weight: number
  courierSetManually: string
  packageAmount: number
  manualAwb: string
  manualUrl: string
  courier: string
  packageType: string
  invoiceValue: number | undefined
  issuanceDate: string
  invoiceNumber: string
  invoiceUrl: string
}

export interface IErrorDetails {
  message: string
  stack: string
  errors?: Array<{ error: { code: number; message: string } }>
}
