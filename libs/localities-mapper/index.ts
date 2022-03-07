import type { ProviderValues } from './enums/providers.enum'
import { ProviderClient } from './utils/provider-client.util'

export default async function localitiesMapper(
  provider: ProviderValues,
  county: string,
  locality: string
): Promise<Record<string, string | number>> {
  const providerClient = new ProviderClient(provider)

  return {
    county: await providerClient.mapCounty(county),
    locality: await providerClient.mapLocality(county, locality),
  }
}
