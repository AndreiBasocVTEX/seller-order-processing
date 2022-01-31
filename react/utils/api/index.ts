import axios from 'axios'
import { IOrder } from '../../typings/order'

export const getOrderDataById = (orderId: string): Promise<IOrder> =>
  axios
    .get(`/api/oms/pvt/orders/${orderId}`)
    .then((response) => response.data)
    .catch((error) => {
      console.log(error)
      return null
    })
