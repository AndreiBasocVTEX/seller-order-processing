import type { IOContext, InstanceOptions } from '@vtex/api'
import { JanusClient } from '@vtex/api'

import {
  UnhandledError,
  ValidationError,
} from '../../core/helpers/error.helper'
import type { ObjectLiteral } from '../../core/models/object-literal.model'
import { BillingsEnum } from '../../shared/enums/billings.enum'
import type {
  CreateInvoiceRequest,
  SmartBillGenerateInvoiceRes,
  SmartbillTaxCodeNamesResponse,
} from '../dto/smartbill.dto'
import createSmartbillOrderPayload from '../helpers/smartbill-create-payload.helper'
import type { GetInvoiceRequest } from '../models/smartbill-get-invoice.model'

export default class SmartBillClient extends JanusClient {
  protected static ENABLED_SETTING_NAME = 'smartbill__isEnabled'

  constructor(ctx: IOContext, options?: InstanceOptions) {
    super(ctx, {
      ...options,
      headers: {
        ...options?.headers,
        baseURL: 'https://ws.smartbill.ro/SBORO/api',
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Vtex-Use-Https': 'true',
      },
    })
  }

  public isActive(settings: ObjectLiteral): boolean {
    return !!settings[SmartBillClient.ENABLED_SETTING_NAME]
  }

  public throwIfDisabled(settings: ObjectLiteral): void | never {
    if (!this.isActive(settings)) {
      throw new ValidationError({
        message: `You need to enable ${BillingsEnum.SMARTBILL} integration to perform this action`,
      })
    }
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
    return this.http
      .get(`/tax?cif=${settings.smartbill__vatCode}`, {
        headers: {
          ...SmartBillClient.getAuthorization(settings),
        },
      })
      .catch((error) => {
        throw UnhandledError.fromError(error)
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

    return (this.http
      .post('/invoice', smartbillPayload, {
        headers: {
          ...SmartBillClient.getAuthorization(settings),
        },
      })
      .catch((error) => {
        throw new UnhandledError({
          message: error?.response?.data?.errorText || error,
        })
      }) as unknown) as Promise<SmartBillGenerateInvoiceRes>
  }

  public async getInvoice({
    settings,
    invoiceNumber,
  }: GetInvoiceRequest): Promise<unknown> {
    return this.http
      .getStream(
        `/invoice/pdf?cif=${settings.smartbill__vatCode}&seriesname=${settings.smartbill__seriesName}&number=${invoiceNumber}`,
        {
          headers: {
            ...SmartBillClient.getAuthorization(settings),
          },
        }
      )
      .catch((error) => {
        throw UnhandledError.fromError(error)
      })
  }
}
