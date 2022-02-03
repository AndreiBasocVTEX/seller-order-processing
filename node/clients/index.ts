import { IOClients } from '@vtex/api'

import Cargus from './carriers/cargus'
import Carrier from './carrier'
import Fancourier from './carriers/fancourier'
import Innoship from './carriers/innoship'
import OrderApi from './orderApi'
import Sameday from './carriers/sameday'
import Status from './status'

// Extend the default IOClients implementation with our own custom clients.
export class Clients extends IOClients {
  public get status() {
    return this.getOrSet('status', Status)
  }

  public get orderApi() {
    return this.getOrSet('orderApi', OrderApi)
  }

  public get fancourier() {
    return this.getOrSet('fancourier', Fancourier)
  }

  public get cargus() {
    return this.getOrSet('cargus', Cargus)
  }

  public get sameday() {
    return this.getOrSet('sameday', Sameday)
  }

  public get innoship() {
    return this.getOrSet('innoship', Innoship)
  }

  public get carrier() {
    return this.getOrSet('carrier', Carrier)
  }
}
