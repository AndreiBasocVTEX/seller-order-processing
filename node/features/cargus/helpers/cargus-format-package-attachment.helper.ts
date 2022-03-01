import { getTotalWeight } from '../../core/helpers/order-dto.helper'
import type { CreateTrackingRequestParams } from '../../shared/clients/carrier-client'
import type { IVtexOrder } from '../../vtex/dto/order.dto'
import type {
  CargusFormattedPackageAttachments,
  ParcelCode,
} from '../dto/cargus-awb.dto'
import { cargusTypeOfPackage, envelopesWeight } from './cargus-constants.helper'

export default function formatPackageAttachments(
  order: IVtexOrder,
  { weight, packageType, numberOfPackages }: CreateTrackingRequestParams
): CargusFormattedPackageAttachments {
  // The selected service does not allow parts weighing more than 31 kg
  const totalWeight = weight ?? getTotalWeight(order)

  const isEnvelope = packageType === 'envelope'

  const isOnePackage = numberOfPackages === 1

  // TODO Add multiple packages support
  const packages: ParcelCode[] = Array.from({ length: numberOfPackages }).map(
    (_) => {
      return {
        // TODO: Replace 1 with something more valid
        Weight: isOnePackage ? totalWeight : 1,
        Type: isEnvelope
          ? cargusTypeOfPackage.envelope
          : cargusTypeOfPackage.parcel,
        Code: isEnvelope ? 'Envelope 1' : 'Parcel 1',
        Length: 1,
        Width: 1,
        Height: 1,
      }
    }
  )

  return {
    numberOfEnvelopes: isEnvelope ? numberOfPackages : 0,
    numberOfParcels: isEnvelope ? 0 : numberOfPackages,
    totalWeight: isEnvelope ? envelopesWeight : totalWeight,
    packages,
  }
}
