import { IOClient } from '@vtex/api'

import { ValidationError } from '../features/core/helpers/error.helper'
import type { ObjectLiteral } from '../features/core/models/object-literal.model'
import { getVtexAppSettings } from '../features/core/utils/getVtexAppSettings'
import type { CarrierClient } from '../features/shared/clients/carrier-client'
import type {
  CarrierIDS,
  CarrierValues,
} from '../features/shared/enums/carriers.enum'
import { CarriersEnum } from '../features/shared/enums/carriers.enum'

export default class CarrierClientFactory extends IOClient {
  public getAvailableCarriers(): string[] {
    return Object.values(CarriersEnum)
  }

  public async getActiveCarriers(
    ctx: Context
  ): Promise<ObjectLiteral<boolean>> {
    const settings = await getVtexAppSettings(ctx)

    return this.getAvailableCarriers().reduce((acc, carrierName) => {
      return {
        ...acc,
        [carrierName]: ((ctx.clients as unknown) as Record<
          string,
          CarrierClient
        >)[carrierName].isActive(settings),
      }
    }, {})
  }

  public getCarrierClientByName(ctx: Context, carrierName: CarrierValues) {
    const carrier = Object.keys(CarriersEnum).find(
      (carrierId) => CarriersEnum[carrierId as CarrierIDS] === carrierName
    )

    if (!carrier) {
      throw new ValidationError({
        message: `Carrier with name ${carrierName} is not available`,
      })
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
