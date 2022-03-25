import { getTotalWeight } from '../../core/helpers/order-dto.helper'
import type { CreateTrackingRequestParams } from '../../shared/clients/carrier-client'
import type { IVtexOrder } from '../../vtex/dto/order.dto'
import type {
  InnoshipFormattedPackageAttachments,
  InnoshipParcel,
} from '../dto/innoship-awb.dto'

export default function formatPackageAttachments(
  order: IVtexOrder,
  { weight, packageType, numberOfPackages }: CreateTrackingRequestParams
): InnoshipFormattedPackageAttachments {
  const isEnvelope = packageType === 'envelope'

  const totalWeight = weight ?? getTotalWeight(order)

  const isOnePackage = numberOfPackages === 1

  const packages: InnoshipParcel[] = Array.from({
    length: numberOfPackages,
  }).map((_, index) => {
    // start from 1
    const sequenceNo = index + 1

    return {
      sequenceNo,
      // TODO: Replace 1 with something more valid
      weight: isOnePackage ? totalWeight : 1,
      type: isEnvelope ? 'Envelope' : 'Parcel',
      reference1: `${
        isEnvelope ? `Envelope ${sequenceNo}` : `Parcel ${sequenceNo}`
      }`,
      size: { width: 1, height: 1, length: 1 },
    }
  })

  return {
    packages,
    totalWeight,
    numberOfEnvelopes: isEnvelope ? numberOfPackages : 0,
    numberOfParcels: isEnvelope ? 0 : numberOfPackages,
  }
}
