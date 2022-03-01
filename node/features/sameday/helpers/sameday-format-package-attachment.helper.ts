import { getTotalWeight } from '../../core/helpers/order-dto.helper'
import type { CreateTrackingRequestParams } from '../../shared/clients/carrier-client'
import type { IVtexOrder } from '../../vtex/dto/order.dto'
import type {
  SamedayParcel,
  SamedayFormattedPackageAttachments,
} from '../dto/sameday-awb.dto'
import { samedayPackage } from './sameday-constants.helper'

export default function formatPackageAttachments(
  order: IVtexOrder,
  { weight, packageType, numberOfPackages }: CreateTrackingRequestParams
): SamedayFormattedPackageAttachments {
  const isEnvelope = packageType === 'envelope'

  const totalWeight = weight ?? getTotalWeight(order)

  const isOnePackage = numberOfPackages === 1

  const packages: SamedayParcel[] = Array.from({
    length: numberOfPackages,
  }).map((_) => {
    return {
      // TODO: Replace 1 with something more valid
      weight: isOnePackage ? totalWeight : 1,
      width: 1,
      height: 1,
      length: 1,
    }
  })

  return {
    packages,
    totalWeight,
    samedayPackageType: isEnvelope
      ? samedayPackage.envelope
      : samedayPackage.parcel,
  }
}
