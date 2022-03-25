import type { AttachmentPackages } from '../typings/normalizedOrder'

export interface IAwbStatusProps {
  orderId: string
  initialData: AttachmentPackages | null
  size: 'small' | 'large'
}
