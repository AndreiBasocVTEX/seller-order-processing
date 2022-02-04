import { IOClients } from '@vtex/api'

import { CargusClient } from '../features/cargus'
import { FancourierClient } from '../features/fancourier'
import { InnoshipClient } from '../features/innoship'
import { SamedayClient } from '../features/sameday'
import Carrier from './carrier'
import OrderClient from './order'

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
    return this.getOrSet('sameday', SamedayClient)
  }

  public get innoship() {
    return this.getOrSet('innoship', InnoshipClient)
  }

  public get carrier() {
    return this.getOrSet('carrier', Carrier)
  }
}
