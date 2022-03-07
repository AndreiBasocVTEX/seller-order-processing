import { ProvidersEnum } from '../enums/providers.enum'
import type { ProviderValues } from '../enums/providers.enum'
import type {
  CountyMappingData,
  LocalityMappingData,
} from '../models/mapping-data.model'

export class ProviderClient {
  private static CountiesByProvider = {
    [ProvidersEnum.FANCOURIER]: () =>
      import('../providers/fancourier/counties'),
    [ProvidersEnum.CARGUS]: () => import('../providers/cargus/counties'),
    [ProvidersEnum.SAMEDAY]: () => import('../providers/sameday/counties'),
    [ProvidersEnum.INNOSHIP]: () => import('../providers/innoship/counties'),
  }

  private static LocalitiesByProvider = {
    [ProvidersEnum.FANCOURIER]: () =>
      import('../providers/fancourier/localities'),
    [ProvidersEnum.CARGUS]: () => import('../providers/cargus/localities'),
    [ProvidersEnum.SAMEDAY]: () => import('../providers/sameday/localities'),
    [ProvidersEnum.INNOSHIP]: () => import('../providers/innoship/localities'),
  }

  private static async loadCountiesForProvider(
    provider: ProviderValues
  ): Promise<CountyMappingData> {
    return ProviderClient.CountiesByProvider[provider]().then(
      ({ default: counties }) => counties
    )
  }

  private static async loadLocalitiesForProvider(
    provider: ProviderValues
  ): Promise<LocalityMappingData> {
    return ProviderClient.LocalitiesByProvider[provider]().then(
      ({ default: localities }) => localities
    )
  }

  private _provider: ProviderValues

  constructor(providerName: ProviderValues) {
    if (!providerName) {
      throw new Error(`Invalid provider '${providerName}'`)
    }

    this._provider = providerName
  }

  public async mapCounty(county: string) {
    const counties = await ProviderClient.loadCountiesForProvider(
      this._provider
    )

    const mappedCounty = counties[county]

    if (typeof mappedCounty === 'function') {
      return mappedCounty()
    }

    return mappedCounty
  }

  public async mapLocality(county: string, locality: string) {
    const localities = await ProviderClient.loadLocalitiesForProvider(
      this._provider
    )

    const mappedLocalities = localities[county]?.[locality]

    if (typeof mappedLocalities === 'function') {
      return mappedLocalities()
    }

    return mappedLocalities
  }
}
