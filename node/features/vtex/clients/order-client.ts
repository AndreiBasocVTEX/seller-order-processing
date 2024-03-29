import { ExternalClient } from '@vtex/api'
import type { InstanceOptions, IOContext } from '@vtex/api'

import type { ITrackAwbInfoResponse } from '../../core/dto/order-api.dto'
import type { NotifyInvoiceRequestDTO } from '../dto/track-and-invoice.dto'
import type { UpdateTrackingStatusRequestDTO } from '../dto/tracking.dto'
import type { IVtexOrder } from '../dto/order.dto'

export default class OrderClient extends ExternalClient {
  constructor(ctx: IOContext, options?: InstanceOptions) {
    super(`http://${ctx.account}.vtexcommercestable.com.br`, ctx, {
      ...options,
      headers: {
        ...options?.headers,
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Vtex-Use-Https': 'true',
        VtexIdclientAutCookie: ctx.adminUserAuthToken ?? ctx.authToken,
      },
    })
  }

  public async getVtexOrderData(orderId: string): Promise<IVtexOrder> {
    return this.http.get(`/api/oms/pvt/orders/${orderId}`)
  }

  public async trackAndInvoice(
    request: NotifyInvoiceRequestDTO
  ): Promise<ITrackAwbInfoResponse> {
    return this.http.post(
      `/api/oms/pvt/orders/${request.orderId}/invoice`,
      request.payload
    )
  }

  public async updateTrackingStatus(
    request: UpdateTrackingStatusRequestDTO
  ): Promise<ITrackAwbInfoResponse> {
    const { orderId, invoiceNumber } = request

    return this.http.put(
      `/api/oms/pvt/orders/${orderId}/invoice/${invoiceNumber}/tracking`,
      request.payload
    )
  }

  public async setOrderStatusToInvoiced(orderId: string): Promise<void> {
    return this.http.post(`/api/oms/pvt/orders/${orderId}/start-handling`, {})
  }

  public async setOrderStatusToReadyForHandling(
    orderId: string
  ): Promise<void> {
    return this.http.post(
      `/api/oms/pvt/orders/${orderId}/changestate/ready-for-handling`,
      {}
    )
  }
}
