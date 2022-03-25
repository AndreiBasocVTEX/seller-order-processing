import type { AxiosError } from 'axios'
import axios from 'axios'

import type { IOrder } from '../../typings/order'
import type { OrderAwbStatus } from '../../typings/OrderAwbStatus'
import type { ICreateAwbProps, ICreateAwbResult } from '../../types/api'
import type { OrderStats } from '../../typings/orderStats'
import type { GetOrderStatsParams } from '../../types/common'
import { parseErrorResponse } from '../errorParser'

const openBlobFile = (data: BlobPart, fileType: string) => {
  const blob = new Blob([data], { type: fileType })
  const blobURL = URL.createObjectURL(blob)

  window.open(blobURL)
}

const errorHandler = async (error: AxiosError<Blob>, status?: () => void) => {
  if (!error.response || status?.()) {
    return
  }

  const response = await parseErrorResponse(error.response)

  throw {
    message: response.message,
    details: response.details,
  }
}

export const getOrderDataById = (orderId: string): Promise<IOrder> =>
  axios
    .get(`/api/oms/pvt/orders/${orderId}`)
    .then((response) => response.data)
    .catch(() => {
      return null
    })

export const getOrderStats = (
  statsParams: GetOrderStatsParams
): Promise<OrderStats> =>
  axios
    .get(`/api/oms/pvt/orders`, {
      params: {
        _stats: 1,
        page: statsParams.page,
        per_page: statsParams.perPage,
        q: statsParams.search,
        f_status: statsParams.status,
        f_creationDate: statsParams.date
          ? `creationDate:[${statsParams.date}]`
          : '',
      },
    })
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

export const createAwbShipping = ({
  orderId,
  invoiceUrl,
  invoiceNumber,
  invoiceValue,
  manualAwb,
  manualUrl,
  courierSetManually,
  service,
  issuanceDate,
  packageAmount,
  packageType,
  weight,
  courier,
}: ICreateAwbProps): Promise<ICreateAwbResult> => {
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
            packageType,
            numberOfPackages: packageAmount,
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

export const downloadInvoice = async (_orderId: string) => {
  await axios
    .get(`/opa/orders/${_orderId}/get-invoice`, {
      params: {
        paperSize: 'A4',
      },
      responseType: 'blob',
    })
    .then((res) => {
      openBlobFile(res.data, 'application/pdf')
    })
    .catch(async (error: AxiosError<Blob>) => {
      await errorHandler(error)
    })
}

export const downloadAwb = async (orderId: string, trackingNumber: string) => {
  await axios
    .get(`/opa/orders/${orderId}/tracking-label`, {
      params: {
        awbTrackingNumber: trackingNumber,
        paperSize: 'A4',
      },
      responseType: 'blob',
    })
    .then((res) => {
      openBlobFile(res.data, 'application/pdf')
    })
    .catch(async (error: AxiosError<Blob>) => {
      await errorHandler(error, () => error.response?.status === 504)
    })
}

export const getActiveProviders = () =>
  axios
    .get(`/opa/get-active-providers`)
    .then((response) => response.data)
    .catch(() => {
      return null
    })
