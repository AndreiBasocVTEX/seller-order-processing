import { IOClients } from '@vtex/api'
import { OMS } from '@vtex/clients'

import EmailClient from './email-client'
import CarrierClientFactory from './carrier-client.factory'
import { CargusClient } from '../features/cargus'
import { FancourierClient } from '../features/fancourier'
import { InnoshipClient } from '../features/innoship'
import { SamedayClient } from '../features/sameday'
import { OrderClient } from '../features/vtex'
import { SmartbillClient } from '../features/smartbill'
import TemplateClient from './template-client'

export class Clients extends IOClients {
  public get orderApi() {
    return this.getOrSet('orderApi', OrderClient)
  }

  public get emailApi() {
    return this.getOrSet('emailApi', EmailClient)
  }

  public get oms() {
    return this.getOrSet('oms', OMS)
  }

  public get templateApi() {
    return this.getOrSet('templateApi', TemplateClient)
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
