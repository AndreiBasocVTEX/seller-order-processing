import type { AxiosError } from 'axios'
import axios from 'axios'

import type { IOrder } from '../../typings/order'
import type { OrderAwbStatus } from '../../typings/OrderAwbStatus'
import type { ICreateAwbResult } from '../../types/api'

export const getOrderDataById = (orderId: string): Promise<IOrder> =>
  axios
    .get(`/api/oms/pvt/orders/${orderId}`)
    .then((response) => response.data)
    .catch(() => {
      return null
    })

export const getOrderAwbStatus = async (
  orderNumber: string
): Promise<OrderAwbStatus> =>
  axios
    .post(`/opa/orders/${orderNumber}/update-tracking-status`)
    .then((response) => response.data)
    .catch(() => {
      return null
    })

export const createAwbShipping = (
  orderId: string,
  service: string,
  weight: number,
  courierSetManually: string,
  packageAmount: number,
  manualAwb: string,
  manualUrl: string,
  courier: string,
  invoiceValue: number | undefined,
  issuanceDate: string,
  invoiceNumber: string,
  invoiceUrl: string
): Promise<ICreateAwbResult> => {
  return axios
    .post(
      `/opa/orders/${orderId}/track-and-invoice`,

      {
        tracking: {
          generate: service !== 'manual',
          provider:
            service === 'manual' ? courierSetManually : service.toLowerCase(),
          params: {
            weight,
            numberOfParcels: packageAmount,
            ...(service === 'manual' && {
              trackingNumber: manualAwb,
              trackingUrl: manualUrl,
            }),
          },
        },
        invoice: {
          provider: courier,
          ...(courier === 'manual' && {
            params: {
              invoiceValue,
              type: 'Output',
              issuanceDate,
              invoiceNumber,
              invoiceUrl,
            },
          }),
        },
      },
      { timeout: 5000 }
    )
    .then((resp) => resp.data)
    .catch((e: AxiosError<{ message: string; stack: string }>) => {
      if (e?.response) {
        throw {
          message: e.response.data.message,
          details: e.response.data.stack,
          ...(e.response.status === 504 && { status: e.response.status }),
        }
      }
    })
}
