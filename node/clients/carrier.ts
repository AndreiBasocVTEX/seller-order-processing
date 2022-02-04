import { ExternalClient } from '@vtex/api'
import type { InstanceOptions, IOContext } from '@vtex/api'

import type { CarrierIDS, CarrierValues } from '../core/enums/carriers.enum'
import { CarriersEnum } from '../core/enums/carriers.enum'

export default class Carrier extends ExternalClient {
  constructor(ctx: IOContext, options?: InstanceOptions) {
    super(`https://${ctx.account}.vtexcommercestable.com.br`, ctx, {
      ...options,
      headers: {
        ...options?.headers,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    })
  }

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
