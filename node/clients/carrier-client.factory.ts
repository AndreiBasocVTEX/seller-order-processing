import { IOClient } from '@vtex/api'

import type {
  CarrierIDS,
  CarrierValues,
} from '../features/shared/enums/carriers.enum'
import { CarriersEnum } from '../features/shared/enums/carriers.enum'

export default class CarrierClientFactory extends IOClient {
  public getAvailableCarriers(): string[] {
    return Object.values(CarriersEnum)
  }

  public getCarrierClientByName(ctx: Context, carrierName: CarrierValues) {
    const carrier = Object.keys(CarriersEnum).find(
      (carrierId) => CarriersEnum[carrierId as CarrierIDS] === carrierName
    )

    if (!carrier) {
      throw new Error(`Carrier with name ${carrierName} is not available`)
    }

    return this.getCarrierClients(ctx)[carrierName]
  }

  /**
   * Any carrier integration should be added in here and enum
   */
  private getCarrierClients(ctx: Context) {
    return {
      [CarriersEnum.CARGUS]: ctx.clients.cargus,
      [CarriersEnum.FANCOURIER]: ctx.clients.fancourier,
      [CarriersEnum.INNOSHIP]: ctx.clients.innoship,
      [CarriersEnum.SAMEDAY]: ctx.clients.sameday,
    }
  }
}
