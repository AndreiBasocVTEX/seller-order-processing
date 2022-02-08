import axios from 'axios'

import type { IOrder } from '../../typings/order'
import type { OrderAwbStatus } from '../../typings/OrderAwbStatus'

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
