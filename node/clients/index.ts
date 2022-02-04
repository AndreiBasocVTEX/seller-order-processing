import { IOClients } from '@vtex/api'

import { CargusClient } from '../features/cargus'
import { FancourierClient } from '../features/fancourier'
import Carrier from './carrier'
import Innoship from './carriers/innoship/innoship'
import OrderClient from './order'
import Sameday from './carriers/sameday/sameday'

export class Clients extends IOClients {
  public get orderApi() {
    return this.getOrSet('orderApi', OrderClient)
  }

  public get fancourier() {
    return this.getOrSet('fancourier', FancourierClient)
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
