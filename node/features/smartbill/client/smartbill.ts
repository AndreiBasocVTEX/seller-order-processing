import type { IOContext, InstanceOptions, Logger } from '@vtex/api'
import { ExternalClient } from '@vtex/api'

import {
  UnhandledError,
  ValidationError,
} from '../../core/helpers/error.helper'
import { formatError } from '../../core/helpers/formatError'
import type { ObjectLiteral } from '../../core/models/object-literal.model'
import { BillingsEnum } from '../../shared/enums/billings.enum'
import type {
  CreateInvoiceRequest,
  SmartBillGenerateInvoiceRes,
  SmartbillTaxCodeNamesResponse,
} from '../dto/smartbill.dto'
import createSmartbillOrderPayload from '../helpers/smartbill-create-payload.helper'
import type { GetInvoiceRequest } from '../models/smartbill-get-invoice.model'

export default class SmartBillClient extends ExternalClient {
  private requiredSettingsFields = [
    'smartbill__isEnabled',
    'smartbill__username',
    'smartbill__apiToken',
    'smartbill__vatCode',
    'smartbill__seriesName',
    'smartbill__invoiceShippingCost',
    'smartbill__invoiceShippingProductName',
    'smartbill__invoiceShippingProductCode',
    'smartbill__defaultVATPercentage',
  ]

  constructor(ctx: IOContext, options?: InstanceOptions) {
    super('http://ws.smartbill.ro/SBORO/api', ctx, {
      ...options,
      headers: {
        ...options?.headers,
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Vtex-Use-Https': 'true',
      },
    })
  }

  public isActive(settings: ObjectLiteral): boolean {
    return this.requiredSettingsFields.every((field) => {
      return settings[field]
    })
  }

  public throwIfDisabled(settings: ObjectLiteral): void | never {
    if (!this.isActive(settings)) {
      throw new ValidationError({
        message: `You need to enable ${BillingsEnum.SMARTBILL} integration to perform this action`,
      })
    }
  }

  private static getAuthorization(
    settings: IOContext['settings'],
    logger?: Logger
  ) {
    // Create buffer object, specifying utf8 as encoding
    const bufferObj = Buffer.from(
      `${settings.smartbill__username}:${settings.smartbill__apiToken}`,
      'utf8'
    )

    logger?.info({
      function: 'getAuthorization',
      client: 'Smartbill',
      message: 'Create buffer object, specifying utf8 as encoding',
      bufferObj,
    })

    // Encode the Buffer as a base64 string
    return { Authorization: `Basic ${bufferObj.toString('base64')}` }
  }

  private async getTaxCodeName(
    settings: IOContext['settings'],
    logger?: Logger
  ): Promise<SmartbillTaxCodeNamesResponse> {
    return this.http
      .get(`/tax?cif=${settings.smartbill__vatCode}`, {
        headers: {
          ...SmartBillClient.getAuthorization(settings, logger),
        },
      })
      .catch((error) => {
        throw UnhandledError.fromError(error)
      })
  }

  public async generateInvoice({
    settings,
    order,
    logger,
  }: CreateInvoiceRequest): Promise<SmartBillGenerateInvoiceRes> {
    const productTaxNames = await this.getTaxCodeName(settings, logger)

    logger?.info({
      function: 'generateInvoice',
      client: 'Smartbill',
      message: 'Get product tax names',
      productTaxNames,
    })

    const smartbillPayload = createSmartbillOrderPayload({
      settings,
      order,
      productTaxNames,
    })

    logger?.info({
      function: 'generateInvoice',
      client: 'Smartbill',
      message: 'Create Smartbill payload',
      smartbillPayload,
    })

    return this.http
      .post<SmartBillGenerateInvoiceRes>('/invoice', smartbillPayload, {
        headers: {
          ...SmartBillClient.getAuthorization(settings, logger),
        },
      })
      .catch((error) => {
        logger?.error({
          data: formatError(error),
        })

        throw new UnhandledError({
          message: error?.response?.data?.errorText || error,
        })
      })
  }

  public async getInvoice({
    settings,
    invoiceNumber,
    logger,
  }: GetInvoiceRequest): Promise<unknown> {
    logger?.info({
      function: 'getInvoice',
      client: 'Smartbill',
      message: 'Get invoice number to generate invoice PDF',
      invoiceNumber,
    })

    return this.http
      .getStream(
        `/invoice/pdf?cif=${settings.smartbill__vatCode}&seriesname=${settings.smartbill__seriesName}&number=${invoiceNumber}`,
        {
          headers: {
            ...SmartBillClient.getAuthorization(settings, logger),
          },
        }
      )
      .catch((error) => {
        logger?.error({
          data: formatError(error),
        })

        throw UnhandledError.fromError(error)
      })
  }
}
