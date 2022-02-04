import { IOClients } from '@vtex/api'

import { CargusClient } from '../features/cargus'
import Carrier from './carrier'
import Fancourier from './carriers/fancourier/fancourier'
import Innoship from './carriers/innoship/innoship'
import OrderClient from './order'
import Sameday from './carriers/sameday/sameday'
import Status from './status'

// Extend the default IOClients implementation with our own custom clients.
export class Clients extends IOClients {
  public get status() {
    return this.getOrSet('status', Status)
  }

  public get orderApi() {
    return this.getOrSet('orderApi', OrderClient)
  }

  public get fancourier() {
    return this.getOrSet('fancourier', Fancourier)
  }

  public get cargus() {
    return this.getOrSet('cargus', CargusClient)
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
