import type { IOContext, InstanceOptions } from '@vtex/api'
import { ExternalClient } from '@vtex/api'

import type {
  CreateInvoiceRequest,
  SmartBillGenerateInvoiceRes,
  SmartbillTaxCodeNamesResponse,
} from '../dto/smartbill.dto'
import createSmartbillOrderPayload from '../helpers/smartbill-create-payload.helper'
import type { GetInvoiceRequest } from '../models/smartbill-get-invoice.model'

export default class SmartBillClient extends ExternalClient {
  constructor(ctx: IOContext, options?: InstanceOptions) {
    super('https://ws.smartbill.ro/SBORO/api', ctx, {
      ...options,
      headers: {
        ...options?.headers,
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Vtex-Use-Https': 'true',
      },
    })
  }

  private static getAuthorization(settings: IOContext['settings']) {
    // Create buffer object, specifying utf8 as encoding
    const bufferObj = Buffer.from(
      `${settings.smartbill__username}:${settings.smartbill__apiToken}`,
      'utf8'
    )

    // Encode the Buffer as a base64 string
    return { Authorization: `Basic ${bufferObj.toString('base64')}` }
  }

  private async getTaxCodeName(
    settings: IOContext['settings']
  ): Promise<SmartbillTaxCodeNamesResponse> {
    return this.http.get(`/tax?cif=${settings.smartbill__vatCode}`, {
      headers: {
        ...SmartBillClient.getAuthorization(settings),
      },
    })
  }

  public async generateInvoice({
    settings,
    order,
  }: CreateInvoiceRequest): Promise<SmartBillGenerateInvoiceRes> {
    const productTaxNames = await this.getTaxCodeName(settings)

    const smartbillPayload = createSmartbillOrderPayload({
      settings,
      order,
      productTaxNames,
    })

    return this.http.post('/invoice', smartbillPayload, {
      headers: {
        ...SmartBillClient.getAuthorization(settings),
      },
    })
  }

  public async getInvoice({
    settings,
    invoiceNumber,
  }: GetInvoiceRequest): Promise<unknown> {
    return this.http.getStream(
      `/invoice/pdf?cif=${settings.smartbill__vatCode}&seriesname=${settings.smartbill__seriesName}&number=${invoiceNumber}`,
      {
        headers: {
          ...SmartBillClient.getAuthorization(settings),
        },
      }
    )
  }
}
