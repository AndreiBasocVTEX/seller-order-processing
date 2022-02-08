import { IOClients } from '@vtex/api'

import CarrierClientFactory from './carrier-client.factory'
import { CargusClient } from '../features/cargus'
import { FancourierClient } from '../features/fancourier'
import { InnoshipClient } from '../features/innoship'
import { SamedayClient } from '../features/sameday'
import { OrderClient } from '../features/vtex'
import { SmartbillClient } from '../features/smartbill'

export class Clients extends IOClients {
  public get vtexOrder() {
    return this.getOrSet('orderApi', OrderClient)
  }

  public get fancourier() {
    return this.getOrSet('fancourier', FancourierClient)
  }

  public get cargus() {
    return this.getOrSet('cargus', CargusClient)
  }

  public get sameday() {
    return this.getOrSet('sameday', SamedayClient)
  }

  public get innoship() {
    return this.getOrSet('innoship', InnoshipClient)
  }

  public get smartbill() {
    return this.getOrSet('smartbill', SmartbillClient)
  }

  public get carrier() {
    return this.getOrSet('carrier', CarrierClientFactory)
  }
}
