import { ExternalClient } from '@vtex/api'
import type { InstanceOptions, IOContext } from '@vtex/api'

import type { VtexAuthData } from '../dto/auth.dto'
import type { ITrackAwbInfoResponse } from '../../core/dto/order-api'
import type { NotifyInvoiceRequestDTO } from '../dto/invoice.dto'
import type { UpdateTrackingStatusRequestDTO } from '../dto/tracking.dto'

export default class OrderClient extends ExternalClient {
  constructor(ctx: IOContext, options?: InstanceOptions) {
    super(`https://${ctx.account}.vtexcommercestable.com.br`, ctx, {
      ...options,
      headers: {
        ...options?.headers,
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Vtex-Use-Https': 'true',
      },
    })
  }

  public async getVtexOrderData(
    vtexAuthData: VtexAuthData,
    orderId: string
  ): Promise<unknown> {
    return this.http.get(`/api/oms/pvt/orders/${orderId}`, {
      headers: {
        'X-VTEX-API-AppKey': vtexAuthData.vtex_appKey,
        'X-VTEX-API-AppToken': vtexAuthData.vtex_appToken,
      },
    })
  }

  public async trackAndInvoice(
    request: NotifyInvoiceRequestDTO
  ): Promise<unknown> {
    return this.http.post(
      `/api/oms/pvt/orders/${request.orderId}/invoice`,
      request.payload,
      {
        headers: {
          'X-VTEX-API-AppKey': request.authData.vtex_appKey,
          'X-VTEX-API-AppToken': request.authData.vtex_appToken,
        },
      }
    )
  }

  public async updateTrackingStatus(
    request: UpdateTrackingStatusRequestDTO
  ): Promise<ITrackAwbInfoResponse> {
    const { orderId, invoiceNumber } = request

    return this.http.put(
      `/api/oms/pvt/orders/${orderId}/invoice/${invoiceNumber}/tracking`,
      request.payload,
      {
        headers: {
          'X-VTEX-API-AppKey': request.authData.vtex_appKey,
          'X-VTEX-API-AppToken': request.authData.vtex_appToken,
        },
      }
    )
  }
}
